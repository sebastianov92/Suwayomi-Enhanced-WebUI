/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { BaseSyntheticEvent, ChangeEvent, ForwardedRef } from 'react';
import { useRef, useState } from 'react';
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

    // Track hover state of the closest ancestor card so we can fade the
    // option button in/out without depending on a parent CSS rule (the
    // upstream `&:hover .manga-option-button` selector did not behave
    // reliably in Safari macOS).
    //
    // We use a callback ref instead of useRef + useEffect so the listeners
    // attach the moment the button mounts. Virtuoso recycles list rows, so
    // mount/unmount happens many times for the same component instance —
    // a stale useEffect with [] deps could leave us without listeners after
    // a recycle, which is why hover felt "broken until you scroll for a
    // while" right after the upstream merge.
    const [cardHovered, setCardHovered] = useState(false);
    const buttonRef = useRef<HTMLButtonElement | null>(null);
    const cleanupRef = useRef<(() => void) | null>(null);

    const setRef = (node: HTMLButtonElement | null) => {
        buttonRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node;

        // Tear down any previous binding (Virtuoso recycle, re-render, etc).
        cleanupRef.current?.();
        cleanupRef.current = null;
        if (!node) {
            setCardHovered(false);
            return;
        }

        // Prefer the closest MUI Card (the visible card box), fall back to
        // the wrapping <a> Link. mouseover/mouseout bubble through
        // descendants, so they're more reliable than enter/leave when the
        // menu portal opens.
        const cardRoot = (node.closest('.MuiCard-root') ?? node.closest('a') ?? node.parentElement) as
            | HTMLElement
            | null;
        if (!cardRoot) return;

        const isInside = (target: EventTarget | null) =>
            target instanceof Node && cardRoot.contains(target);

        const onOver = (e: MouseEvent) => {
            if (isInside(e.target) || isInside(e.relatedTarget)) {
                setCardHovered(true);
            }
        };
        const onOut = (e: MouseEvent) => {
            if (!isInside(e.relatedTarget)) {
                setCardHovered(false);
            }
        };

        cardRoot.addEventListener('mouseover', onOver);
        cardRoot.addEventListener('mouseout', onOut);
        cleanupRef.current = () => {
            cardRoot.removeEventListener('mouseover', onOver);
            cardRoot.removeEventListener('mouseout', onOut);
        };
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

    const showOnDesktop = cardHovered || popupState.isOpen;

    return (
        <CustomTooltip title={t`Options`}>
            <Button
                ref={setRef}
                onMouseDown={openPopup}
                onMouseEnter={() => setCardHovered(true)}
                onClick={stopAll}
                onTouchStart={openPopup}
                className="manga-option-button"
                size="small"
                variant="contained"
                sx={{
                    minWidth: 'unset',
                    paddingX: '0',
                    paddingY: '2.5px',
                    transition: 'opacity 120ms ease',
                    // Always visible + clickable on desktop. We fade with
                    // opacity instead of visibility:hidden so even if the
                    // JS hover tracker misses an event the button stays
                    // tappable (the previous implementation left users
                    // with an invisible-and-unclickable affordance).
                    opacity: showOnDesktop ? 1 : 0,
                    pointerEvents: 'all',
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
