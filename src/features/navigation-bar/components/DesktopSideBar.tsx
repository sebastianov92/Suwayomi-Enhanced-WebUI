/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import Divider from '@mui/material/Divider';
import { useEffect } from 'react';
import Box from '@mui/material/Box';
import { CustomTooltip } from '@/base/components/CustomTooltip.tsx';
import { useGetOptionForDirection } from '@/features/theme/services/ThemeCreator.ts';
import { useNavBarContext } from '@/features/navigation-bar/NavbarContext.tsx';
import type { NavbarItem } from '@/features/navigation-bar/NavigationBar.types.ts';
import { NavigationBarItem } from '@/features/navigation-bar/components/NavigationBarItem.tsx';
import { SuwayomiLogo } from '@/base/components/SuwayomiLogo.tsx';

const WIDTH_COLLAPSED = 72;
const WIDTH_EXPANDED = 180;

const TRANSITION = 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)';

export const DesktopSideBar = ({ navBarItems }: { navBarItems: NavbarItem[] }) => {
    const { isCollapsed, setIsCollapsed, setNavBarWidth } = useNavBarContext();
    const getOptionForDirection = useGetOptionForDirection();

    const drawerWidth = isCollapsed ? WIDTH_COLLAPSED : WIDTH_EXPANDED;

    useEffect(() => {
        setNavBarWidth(drawerWidth);
    }, [drawerWidth]);

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: drawerWidth,
                flexShrink: 0,
                transition: TRANSITION,
                '& .MuiDrawer-paper': {
                    zIndex: (theme) => theme.zIndex.drawer - 1,
                    width: drawerWidth,
                    transition: TRANSITION,
                    overflowX: 'hidden',
                    borderRight: '1px solid',
                    borderColor: (theme) =>
                        theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)',
                    backgroundColor: (theme) =>
                        theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                },
            }}
        >
            <Box
                sx={{
                    pt: 'env(safe-area-inset-top)',
                    pl: 'env(safe-area-inset-left)',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    overflowX: 'hidden',
                }}
            >
                <Toolbar
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    sx={{
                        justifyContent: isCollapsed ? 'center' : 'flex-start',
                        px: '12px !important',
                        cursor: 'pointer',
                        boxShadow: (theme) =>
                            theme.palette.mode === 'dark'
                                ? 'inset 0 -1px 0 rgba(255,255,255,0.06)'
                                : 'inset 0 -1px 0 rgba(0,0,0,0.08)',
                    }}
                >
                    <SuwayomiLogo collapsed={isCollapsed} />
                </Toolbar>

                <List sx={{ p: isCollapsed ? 0.5 : 1, flex: 1 }} dense={isCollapsed}>
                    {navBarItems.map((navBarItem) => (
                        <NavigationBarItem key={navBarItem.path} {...navBarItem} />
                    ))}
                </List>

                <Divider sx={{ opacity: 0.4, mx: 1 }} />
                <Box
                    sx={{
                        p: 1,
                        pb: 'calc(8px + env(safe-area-inset-bottom))',
                        display: 'flex',
                        justifyContent: 'center',
                    }}
                >
                    <CustomTooltip title={isCollapsed ? 'Expand' : 'Collapse'} placement="right">
                        <IconButton
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            sx={{
                                borderRadius: '10px',
                                width: isCollapsed ? 40 : '100%',
                                height: 40,
                                color: 'text.secondary',
                                backgroundColor: (theme) =>
                                    theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                                '&:hover': {
                                    backgroundColor: (theme) =>
                                        theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                                },
                            }}
                        >
                            <ChevronLeftIcon
                                fontSize="small"
                                sx={{
                                    transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    transform: isCollapsed
                                        ? getOptionForDirection('rotate(180deg)', 'rotate(0deg)')
                                        : getOptionForDirection('rotate(0deg)', 'rotate(180deg)'),
                                }}
                            />
                        </IconButton>
                    </CustomTooltip>
                </Box>
            </Box>
        </Drawer>
    );
};
