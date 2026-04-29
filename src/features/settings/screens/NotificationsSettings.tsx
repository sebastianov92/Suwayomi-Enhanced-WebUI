/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { useMutation } from '@apollo/client/react';
import { useLingui } from '@lingui/react/macro';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import { TextSetting } from '@/base/components/settings/text/TextSetting.tsx';
import { LoadingPlaceholder } from '@/base/components/feedback/LoadingPlaceholder.tsx';
import { EmptyViewAbsoluteCentered } from '@/base/components/feedback/EmptyViewAbsoluteCentered.tsx';
import { useAppTitle } from '@/features/navigation-bar/hooks/useAppTitle.ts';
import { requestManager } from '@/lib/requests/RequestManager.ts';
import { makeToast } from '@/base/utils/Toast.ts';
import { getErrorMessage } from '@/lib/HelperFunctions.ts';
import type { ServerSettings as ServerSettingsType } from '@/features/settings/Settings.types.ts';
import { SEND_TEST_NOTIFICATION } from '@/lib/graphql/notifications/NotificationsMutation.ts';
import type {
    SendTestNotificationMutation,
    SendTestNotificationMutationVariables,
} from '@/lib/graphql/generated/graphql.ts';

export function NotificationsSettings() {
    const { t } = useLingui();
    useAppTitle(t`Notifications`);

    const apolloClient = requestManager.graphQLClient.client;

    const {
        data,
        loading,
        error,
        refetch,
    } = requestManager.useGetServerSettings({ notifyOnNetworkStatusChange: true });
    const [mutateSettings] = requestManager.useUpdateServerSettings();

    const [sendTest, sendTestState] = useMutation<
        SendTestNotificationMutation,
        SendTestNotificationMutationVariables
    >(SEND_TEST_NOTIFICATION, { client: apolloClient });

    const updateSetting = async <K extends keyof ServerSettingsType>(
        key: K,
        value: ServerSettingsType[K],
    ) => {
        try {
            await mutateSettings({ variables: { input: { settings: { [key]: value } } } });
        } catch (e) {
            makeToast(t`Failed to save`, 'error', getErrorMessage(e));
        }
    };

    if (loading) return <LoadingPlaceholder />;
    if (error) {
        return (
            <EmptyViewAbsoluteCentered
                message={t`Could not load settings`}
                messageExtra={getErrorMessage(error)}
                retry={() => refetch().catch(() => {})}
            />
        );
    }

    const settings = data?.settings;
    if (!settings) return null;

    const enabled = settings.telegramNotificationsEnabled ?? false;
    const token = settings.telegramBotToken ?? '';
    const chatId = settings.telegramChatId ?? '';

    return (
        <Box sx={{ pb: 4 }}>
            <List
                subheader={<ListSubheader>{t`Telegram bot`}</ListSubheader>}
                sx={{ pt: 0 }}
            >
                <ListItem>
                    <ListItemText
                        primary={t`Enable Telegram notifications`}
                        secondary={t`Send a message when the library detects new chapters.`}
                    />
                    <Switch
                        edge="end"
                        checked={enabled}
                        onChange={(_, checked) => updateSetting('telegramNotificationsEnabled', checked)}
                    />
                </ListItem>
                <TextSetting
                    settingName={t`Bot token`}
                    dialogDescription={t`The token your @BotFather chat gave you when creating the bot.`}
                    value={token}
                    handleChange={(v) => updateSetting('telegramBotToken', v)}
                />
                <TextSetting
                    settingName={t`Chat id`}
                    dialogDescription={t`Your numeric chat id (or channel id). DM @userinfobot to find yours.`}
                    value={chatId}
                    handleChange={(v) => updateSetting('telegramChatId', v)}
                />
            </List>

            <Box sx={{ px: 2, pt: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {t`Send a test message to confirm your bot can reach you.`}
                </Typography>
                <Stack direction="row" spacing={1}>
                    <Button
                        variant="contained"
                        disabled={!enabled || !token || !chatId || sendTestState.loading}
                        onClick={async () => {
                            try {
                                const res = await sendTest({ variables: { input: {} } });
                                if (res.data?.sendTestNotification?.sent) {
                                    makeToast(t`Test message sent`, 'success');
                                } else {
                                    makeToast(t`Test message failed`, 'error');
                                }
                            } catch (e) {
                                makeToast(t`Test message failed`, 'error', getErrorMessage(e));
                            }
                        }}
                    >
                        {t`Send test message`}
                    </Button>
                </Stack>
            </Box>
        </Box>
    );
}
