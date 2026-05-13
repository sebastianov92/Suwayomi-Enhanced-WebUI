/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { BaseSyntheticEvent, ChangeEvent, ForwardedRef } from 'react';
import { useRef } from 'react';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import type { PopupState } from 'material-ui-popup-state/hooks';
import { useLingui } from '@lingui/react/macro';
import { CustomTooltip } from '@/base/components/CustomTooltip.tsx';
import type { SelectableCollectionReturnType } from '@/base/collection/hooks/useSelectableCollection.ts';
import type { MangaType } from '@/lib/graphql/generated/graphql.ts';
import { MUIUtil } from '@/lib/mui/MUI.util.ts';

const preventDefaultAction = (e: BaseSyntheticEvent) => {
    e.stopPropagation();
    e.preventDefault();
};

const stopAll = (e: BaseSyntheticEvent) => {
    e.stopPropagation();
    const native = e.nativeEvent as Event | undefined;
    native?.stopImmediatePropagation?.();
    e.preventDefault();
};

export const MangaOptionButton = ({
    id,
    selected,
    handleSelection,
    asCheckbox = false,
    popupState,
    ref,
}: {
    id: number;
    selected?: boolean | null;
    handleSelection?: SelectableCollectionReturnType<MangaType['id']>['handleSelection'];
    asCheckbox?: boolean;
    popupState: PopupState;
    ref?: ForwardedRef<HTMLButtonElement | null>;
}) => {
    const { t } = useLingui();

    // Hover detection is CSS-only — the parent card already declares
    // `&:hover .manga-option-button { ... }` rules. The previous JS
    // tracker tried to attach listeners via callback ref, but Virtuoso
    // recycles its row instances without re-firing the ref (same React
    // instance + same DOM node, only manga.id changes), so library
    // cards never picked up new listeners after the first scroll and
    // hover stayed broken.
    //
    // We still track `popupState.isOpen` in JS so the button keeps the
    // visible state while the menu is mounted (which detaches focus
    // from the card).
    const buttonRef = useRef<HTMLButtonElement | null>(null);
    const setRef = (node: HTMLButtonElement | null) => {
        buttonRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node;
    };

    // Open the popup synchronously on pointer-down, before the parent
    // <Link>/<CardActionArea>'s long-press / click handlers can fire.
    // This avoids the chained-handler ordering issues we hit on Safari
    // where the first click did nothing.
    const openPopup = (e: React.SyntheticEvent<HTMLElement>) => {
        stopAll(e);
        if (popupState.isOpen) {
            popupState.close();
        } else {
            popupState.open(e.currentTarget as HTMLElement);
        }
    };

    const handleSelectionChange = (e: ChangeEvent, isSelected: boolean) => {
        preventDefaultAction(e);
        handleSelection?.(id, isSelected);
    };

    if (!handleSelection) {
        return null;
    }

    const isSelected = selected !== null;
    if (isSelected) {
        if (!asCheckbox) {
            return null;
        }

        return (
            <CustomTooltip title={selected ? t`Deselect` : t`Select`}>
                <Checkbox {...MUIUtil.preventRippleProp()} checked={selected} onChange={handleSelectionChange} />
            </CustomTooltip>
        );
    }

    if (asCheckbox) {
        return (
            <CustomTooltip title={t`Options`}>
                <IconButton
                    ref={ref}
                    onMouseDown={openPopup}
                    onClick={stopAll}
                    onTouchStart={openPopup}
                    aria-label="more"
                >
                    <MoreVertIcon />
                </IconButton>
            </CustomTooltip>
        );
    }

    return (
        <CustomTooltip title={t`Options`}>
            <Button
                ref={setRef}
                onMouseDown={openPopup}
                onClick={stopAll}
                onTouchStart={openPopup}
                className={`manga-option-button${popupState.isOpen ? ' manga-option-button--open' : ''}`}
                size="small"
                variant="contained"
                sx={{
                    minWidth: 'unset',
                    paddingX: '0',
                    paddingY: '2.5px',
                    transition: 'opacity 120ms ease',
                    // Default state on desktop is hidden + non-interactive;
                    // the parent card flips both via its `&:hover
                    // .manga-option-button` rule. The `--open` modifier
                    // keeps the button visible while the menu is mounted
                    // (the card loses hover when the portal opens, so
                    // without this the button would vanish mid-action).
                    opacity: popupState.isOpen ? 1 : 0,
                    pointerEvents: popupState.isOpen ? 'all' : 'none',
                    '@media (hover: hover) and (pointer: fine)': {
                        '.MuiCard-root:hover &, a:hover &, &.manga-option-button--open': {
                            opacity: 1,
                            pointerEvents: 'all',
                        },
                    },
                    '@media not (pointer: fine)': {
                        visibility: popupState.isOpen ? 'visible' : 'hidden',
                        opacity: popupState.isOpen ? 1 : 0,
                        pointerEvents: popupState.isOpen ? 'all' : 'none',
                        width: popupState.isOpen ? undefined : 0,
                        height: popupState.isOpen ? undefined : 0,
                        p: popupState.isOpen ? undefined : 0,
                        m: popupState.isOpen ? undefined : 0,
                    },
                }}
            >
                <MoreVertIcon />
            </Button>
        </CustomTooltip>
    );
};
