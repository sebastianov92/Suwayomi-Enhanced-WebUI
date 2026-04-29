/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { BaseSyntheticEvent, ChangeEvent, ForwardedRef } from 'react';
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
                ref={ref}
                onMouseDown={openPopup}
                onClick={stopAll}
                onTouchStart={openPopup}
                className="manga-option-button"
                size="small"
                variant="contained"
                sx={{
                    minWidth: 'unset',
                    paddingX: '0',
                    paddingY: '2.5px',
                    // Hidden by default; the parent MangaGridCard sets
                    // `&:hover .manga-option-button { visibility: visible; pointer-events: all }`
                    // on (hover: hover) and (pointer: fine) devices. While the
                    // popup is open we keep it visible regardless of hover so
                    // it doesn't disappear when the menu portal steals focus.
                    visibility: popupState.isOpen ? 'visible' : 'hidden',
                    pointerEvents: popupState.isOpen ? 'all' : 'none',
                    '@media not (pointer: fine)': {
                        visibility: popupState.isOpen ? 'visible' : 'hidden',
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
