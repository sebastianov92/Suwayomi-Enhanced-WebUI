/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { useMutation, useQuery } from '@apollo/client/react';
import { useLingui } from '@lingui/react/macro';
import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router-dom';
import { TextSetting } from '@/base/components/settings/text/TextSetting.tsx';
import { LoadingPlaceholder } from '@/base/components/feedback/LoadingPlaceholder.tsx';
import { EmptyViewAbsoluteCentered } from '@/base/components/feedback/EmptyViewAbsoluteCentered.tsx';
import { useAppTitle } from '@/features/navigation-bar/hooks/useAppTitle.ts';
import { requestManager } from '@/lib/requests/RequestManager.ts';
import { makeToast } from '@/base/utils/Toast.ts';
import { getErrorMessage } from '@/lib/HelperFunctions.ts';
import type { ServerSettings as ServerSettingsType } from '@/features/settings/Settings.types.ts';
import { SEND_TEST_NOTIFICATION } from '@/lib/graphql/notifications/NotificationsMutation.ts';
import { GET_EMAIL_PRESETS } from '@/lib/graphql/kindle/KindleQuery.ts';
import {
    SEND_TEST_EMAIL,
    SET_SMTP_PASSWORD,
} from '@/lib/graphql/kindle/KindleMutation.ts';
import type {
    GetEmailPresetsQuery,
    SendTestEmailMutation,
    SendTestEmailMutationVariables,
    SendTestNotificationMutation,
    SendTestNotificationMutationVariables,
    SetSmtpPasswordMutation,
    SetSmtpPasswordMutationVariables,
} from '@/lib/graphql/generated/graphql.ts';
import { AppRoutes } from '@/base/AppRoute.constants.ts';

const SEND_INTERVAL_OPTIONS = [
    { value: 65, label: '65 s' },
    { value: 90, label: '90 s (default)' },
    { value: 120, label: '120 s' },
];

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

    const presetsQuery = useQuery<GetEmailPresetsQuery>(GET_EMAIL_PRESETS, { client: apolloClient });

    const [sendTestTelegram, sendTelegramState] = useMutation<
        SendTestNotificationMutation,
        SendTestNotificationMutationVariables
    >(SEND_TEST_NOTIFICATION, { client: apolloClient });

    const [setSmtpPassword] = useMutation<SetSmtpPasswordMutation, SetSmtpPasswordMutationVariables>(
        SET_SMTP_PASSWORD,
        { client: apolloClient },
    );
    const [sendTestEmail, sendEmailState] = useMutation<
        SendTestEmailMutation,
        SendTestEmailMutationVariables
    >(SEND_TEST_EMAIL, { client: apolloClient });

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

    const [pwInput, setPwInput] = useState('');

    // Re-sync the password input field whenever the saved value changes
    // (e.g. user typed a new password and we just saved it).
    useEffect(() => {
        setPwInput('');
    }, [data?.settings?.smtpPasswordEncrypted]);

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

    const provider = settings.smtpProvider ?? 'NONE';
    const host = settings.smtpHost ?? '';
    const port = settings.smtpPort ?? 587;
    const tls = settings.smtpUseStartTls ?? true;
    const smtpUser = settings.smtpUsername ?? '';
    const kindleEmail = settings.kindleEmail ?? '';
    const passwordSet = !!settings.smtpPasswordEncrypted;
    const interval = settings.kindleSendIntervalSeconds ?? 90;
    const ebookRtl = settings.ebookRtl ?? true;
    const autoSendGlobal = settings.kindleAutoSendEnabled ?? false;
    const notifyOnSend = settings.notifyOnKindleSend ?? true;

    const presets = presetsQuery.data?.emailPresets ?? [];
    const isCustom = provider === 'CUSTOM' || provider === 'NONE';

    const applyPreset = async (presetId: string) => {
        if (presetId === 'CUSTOM' || presetId === 'NONE') {
            await updateSetting('smtpProvider', presetId);
            return;
        }
        const preset = presets.find((p) => p.id === presetId);
        if (!preset) return;
        await mutateSettings({
            variables: {
                input: {
                    settings: {
                        smtpProvider: presetId,
                        smtpHost: preset.host,
                        smtpPort: preset.port,
                        smtpUseStartTls: preset.useStartTls,
                    },
                },
            },
        });
    };

    return (
        <Box sx={{ pb: 4 }}>
            {/* ------- Telegram ------- */}
            <List subheader={<ListSubheader>{t`Telegram bot`}</ListSubheader>} sx={{ pt: 0 }}>
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
                    dialogDescription={t`Your numeric chat id. DM @userinfobot to find yours.`}
                    value={chatId}
                    handleChange={(v) => updateSetting('telegramChatId', v)}
                />
                <ListItem>
                    <Stack direction="row" spacing={1}>
                        <Button
                            variant="contained"
                            disabled={!enabled || !token || !chatId || sendTelegramState.loading}
                            onClick={async () => {
                                try {
                                    const res = await sendTestTelegram({ variables: { input: {} } });
                                    if (res.data?.sendTestNotification?.sent) {
                                        makeToast(t`Telegram test sent`, 'success');
                                    } else {
                                        makeToast(t`Telegram test failed`, 'error');
                                    }
                                } catch (e) {
                                    makeToast(t`Telegram test failed`, 'error', getErrorMessage(e));
                                }
                            }}
                        >
                            {t`Send Telegram test`}
                        </Button>
                    </Stack>
                </ListItem>
            </List>

            {/* ------- SMTP / Kindle ------- */}
            <List subheader={<ListSubheader>{t`SMTP & Send-to-Kindle`}</ListSubheader>}>
                <ListItem>
                    <Stack spacing={2} sx={{ flex: 1, py: 1 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>{t`Provider`}</InputLabel>
                            <Select
                                value={provider}
                                label={t`Provider`}
                                onChange={(e) => applyPreset(e.target.value as string)}
                            >
                                <MenuItem value="NONE">{t`Disabled`}</MenuItem>
                                {presets.map((p) => (
                                    <MenuItem key={p.id} value={p.id}>
                                        {p.displayName}
                                    </MenuItem>
                                ))}
                                <MenuItem value="CUSTOM">{t`Custom server…`}</MenuItem>
                            </Select>
                        </FormControl>
                        {isCustom && (
                            <>
                                <Stack direction="row" spacing={1}>
                                    <TextField
                                        size="small"
                                        fullWidth
                                        label={t`Host`}
                                        value={host}
                                        onChange={(e) => updateSetting('smtpHost', e.target.value)}
                                    />
                                    <TextField
                                        size="small"
                                        label={t`Port`}
                                        value={port}
                                        onChange={(e) =>
                                            updateSetting('smtpPort', Number(e.target.value) || 587)
                                        }
                                        sx={{ width: 100 }}
                                    />
                                </Stack>
                                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                                    <Typography variant="body2" sx={{ flex: 1 }}>
                                        {t`Use STARTTLS`}
                                    </Typography>
                                    <Switch
                                        checked={tls}
                                        onChange={(_, checked) => updateSetting('smtpUseStartTls', checked)}
                                    />
                                </Stack>
                            </>
                        )}
                        <TextField
                            size="small"
                            fullWidth
                            label={t`Username (your email)`}
                            value={smtpUser}
                            onChange={(e) => updateSetting('smtpUsername', e.target.value)}
                        />
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                            <TextField
                                size="small"
                                fullWidth
                                type="password"
                                label={passwordSet ? t`Password (saved — type to replace)` : t`Password`}
                                value={pwInput}
                                onChange={(e) => setPwInput(e.target.value)}
                            />
                            <Button
                                variant="outlined"
                                disabled={pwInput.length === 0}
                                onClick={async () => {
                                    try {
                                        await setSmtpPassword({
                                            variables: { input: { password: pwInput } },
                                        });
                                        makeToast(t`Password saved (encrypted)`, 'success');
                                        await refetch().catch(() => {});
                                    } catch (e) {
                                        makeToast(t`Failed to save password`, 'error', getErrorMessage(e));
                                    }
                                }}
                            >
                                {t`Save`}
                            </Button>
                        </Stack>
                        <TextField
                            size="small"
                            fullWidth
                            label={t`Kindle email (@kindle.com)`}
                            value={kindleEmail}
                            onChange={(e) => updateSetting('kindleEmail', e.target.value)}
                        />
                        <FormControl fullWidth size="small">
                            <InputLabel>{t`Throttle interval`}</InputLabel>
                            <Select
                                value={interval}
                                label={t`Throttle interval`}
                                onChange={(e) =>
                                    updateSetting('kindleSendIntervalSeconds', Number(e.target.value))
                                }
                            >
                                {SEND_INTERVAL_OPTIONS.map((opt) => (
                                    <MenuItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Stack>
                </ListItem>

                <ListItem>
                    <ListItemText
                        primary={t`RTL ebooks`}
                        secondary={t`Manga reading direction (right-to-left).`}
                    />
                    <Switch
                        edge="end"
                        checked={ebookRtl}
                        onChange={(_, checked) => updateSetting('ebookRtl', checked)}
                    />
                </ListItem>

                <ListItem>
                    <ListItemText
                        primary={t`Auto-send all library`}
                        secondary={t`When on, every newly-detected chapter for any in-library manga is queued.`}
                    />
                    <Switch
                        edge="end"
                        checked={autoSendGlobal}
                        onChange={(_, checked) => updateSetting('kindleAutoSendEnabled', checked)}
                    />
                </ListItem>

                <ListItem>
                    <ListItemText
                        primary={t`Telegram notify on Kindle send`}
                        secondary={t`Notify when a chapter has been delivered (or fails) to Kindle.`}
                    />
                    <Switch
                        edge="end"
                        checked={notifyOnSend}
                        onChange={(_, checked) => updateSetting('notifyOnKindleSend', checked)}
                    />
                </ListItem>

                <ListItem>
                    <Stack direction="row" spacing={1}>
                        <Button
                            variant="contained"
                            disabled={
                                !smtpUser ||
                                !host ||
                                !passwordSet ||
                                !kindleEmail ||
                                sendEmailState.loading
                            }
                            onClick={async () => {
                                try {
                                    const res = await sendTestEmail({
                                        variables: { input: { destination: kindleEmail } },
                                    });
                                    if (res.data?.sendTestEmail?.sent) {
                                        makeToast(t`Email test sent`, 'success');
                                    } else {
                                        makeToast(
                                            t`Email test failed`,
                                            'error',
                                            res.data?.sendTestEmail?.message ?? '',
                                        );
                                    }
                                } catch (e) {
                                    makeToast(t`Email test failed`, 'error', getErrorMessage(e));
                                }
                            }}
                        >
                            {t`Send email test`}
                        </Button>
                        <Button
                            variant="outlined"
                            component={RouterLink}
                            to={AppRoutes.settings.childRoutes.kindleQueue.path}
                        >
                            {t`Open Kindle queue`}
                        </Button>
                    </Stack>
                </ListItem>
            </List>
        </Box>
    );
}
