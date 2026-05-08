/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import List from '@mui/material/List';
import BackupIcon from '@mui/icons-material/Backup';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import CollectionsOutlinedBookmarkIcon from '@mui/icons-material/CollectionsBookmarkOutlined';
import GetAppOutlinedIcon from '@mui/icons-material/GetAppOutlined';
import DnsIcon from '@mui/icons-material/Dns';
import WebIcon from '@mui/icons-material/Web';
import ExploreOutlinedIcon from '@mui/icons-material/ExploreOutlined';
import DevicesIcon from '@mui/icons-material/Devices';
import SyncIcon from '@mui/icons-material/Sync';
import PaletteIcon from '@mui/icons-material/Palette';
import HistoryIcon from '@mui/icons-material/History';
import ImageIcon from '@mui/icons-material/Image';
import LabelIcon from '@mui/icons-material/Label';
import NotificationsIcon from '@mui/icons-material/Notifications';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import SendIcon from '@mui/icons-material/Send';
import RssFeedIcon from '@mui/icons-material/RssFeed';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useLingui } from '@lingui/react/macro';
import { ListItemLink } from '@/base/components/lists/ListItemLink.tsx';
import { AppRoutes } from '@/base/AppRoute.constants.ts';
import { useAppTitle } from '@/features/navigation-bar/hooks/useAppTitle.ts';

function SettingsSection({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <Box sx={{ mb: 1 }}>
            <Typography
                variant="overline"
                sx={{
                    px: 2,
                    pt: 2,
                    pb: 0.5,
                    display: 'block',
                    color: 'primary.main',
                    fontWeight: 600,
                    fontSize: '0.7rem',
                }}
            >
                {label}
            </Typography>
            <List
                sx={(theme) => ({
                    p: 0.5,
                    px: 1,
                    // Match the sidebar look in light mode: idle entries
                    // (icon + label) take primary.main. Dark theme keeps
                    // its existing default rendering.
                    '& .MuiListItemIcon-root': { color: 'primary.dark' },
                    '& .MuiListItemText-primary': { color: 'primary.dark' },
                    ...theme.applyStyles('dark', {
                        '& .MuiListItemIcon-root': { color: undefined },
                        '& .MuiListItemText-primary': { color: undefined },
                    }),
                })}
                dense
            >
                {children}
            </List>
        </Box>
    );
}

export function Settings() {
    const { t } = useLingui();

    useAppTitle(t`Settings`);

    return (
        <Box sx={{ maxWidth: 720, pb: 4 }}>
            <SettingsSection label={t`General`}>
                <ListItemLink to={AppRoutes.settings.childRoutes.appearance.path}>
                    <ListItemIcon>
                        <PaletteIcon />
                    </ListItemIcon>
                    <ListItemText primary={t`Appearance`} />
                </ListItemLink>
                <ListItemLink to={AppRoutes.settings.childRoutes.reader.path}>
                    <ListItemIcon>
                        <AutoStoriesIcon />
                    </ListItemIcon>
                    <ListItemText primary={t`Reader`} />
                </ListItemLink>
                <ListItemLink to={AppRoutes.settings.childRoutes.library.path}>
                    <ListItemIcon>
                        <CollectionsOutlinedBookmarkIcon />
                    </ListItemIcon>
                    <ListItemText primary={t`Library`} />
                </ListItemLink>
            </SettingsSection>

            <SettingsSection label={t`Content`}>
                <ListItemLink to={AppRoutes.settings.childRoutes.download.path}>
                    <ListItemIcon>
                        <GetAppOutlinedIcon />
                    </ListItemIcon>
                    <ListItemText primary={t`Downloads`} />
                </ListItemLink>
                <ListItemLink to={AppRoutes.settings.childRoutes.images.path}>
                    <ListItemIcon>
                        <ImageIcon />
                    </ListItemIcon>
                    <ListItemText primary={t`Images`} />
                </ListItemLink>
                <ListItemLink to={AppRoutes.settings.childRoutes.tracking.path}>
                    <ListItemIcon>
                        <SyncIcon />
                    </ListItemIcon>
                    <ListItemText primary={t`Tracking`} />
                </ListItemLink>
                <ListItemLink to={AppRoutes.settings.childRoutes.backup.path}>
                    <ListItemIcon>
                        <BackupIcon />
                    </ListItemIcon>
                    <ListItemText primary={t`Backup`} />
                </ListItemLink>
            </SettingsSection>

            <SettingsSection label={t`Sources`}>
                <ListItemLink to={AppRoutes.settings.childRoutes.browse.path}>
                    <ListItemIcon>
                        <ExploreOutlinedIcon />
                    </ListItemIcon>
                    <ListItemText primary={t`Browse`} />
                </ListItemLink>
                <ListItemLink to={AppRoutes.settings.childRoutes.scanlatorAliases.path}>
                    <ListItemIcon>
                        <LabelIcon />
                    </ListItemIcon>
                    <ListItemText primary={t`Scanlator aliases`} />
                </ListItemLink>
                <ListItemLink to={AppRoutes.settings.childRoutes.localSource.path}>
                    <ListItemIcon>
                        <FolderOpenIcon />
                    </ListItemIcon>
                    <ListItemText primary={t`Local source`} />
                </ListItemLink>
            </SettingsSection>

            <SettingsSection label={t`Advanced`}>
                <ListItemLink to={AppRoutes.settings.childRoutes.notifications.path}>
                    <ListItemIcon>
                        <NotificationsIcon />
                    </ListItemIcon>
                    <ListItemText primary={t`Notifications`} />
                </ListItemLink>
                <ListItemLink to={AppRoutes.settings.childRoutes.sendToKindle.path}>
                    <ListItemIcon>
                        <SendIcon />
                    </ListItemIcon>
                    <ListItemText primary={t`Send to Kindle`} />
                </ListItemLink>
                <ListItemLink to={AppRoutes.settings.childRoutes.history.path}>
                    <ListItemIcon>
                        <HistoryIcon />
                    </ListItemIcon>
                    <ListItemText primary={t`History`} />
                </ListItemLink>
            </SettingsSection>

            <SettingsSection label={t`System`}>
                <ListItemLink to={AppRoutes.settings.childRoutes.device.path}>
                    <ListItemIcon>
                        <DevicesIcon />
                    </ListItemIcon>
                    <ListItemText primary={t`Device`} />
                </ListItemLink>
                <ListItemLink to={AppRoutes.settings.childRoutes.webui.path}>
                    <ListItemIcon>
                        <WebIcon />
                    </ListItemIcon>
                    <ListItemText primary={t`WebUI`} />
                </ListItemLink>
                <ListItemLink to={AppRoutes.settings.childRoutes.server.path}>
                    <ListItemIcon>
                        <DnsIcon />
                    </ListItemIcon>
                    <ListItemText primary={t`Server`} />
                </ListItemLink>
                <ListItemLink to={AppRoutes.settings.childRoutes.opds.path}>
                    <ListItemIcon>
                        <RssFeedIcon />
                    </ListItemIcon>
                    <ListItemText primary={t`OPDS`} />
                </ListItemLink>
            </SettingsSection>
        </Box>
    );
}
