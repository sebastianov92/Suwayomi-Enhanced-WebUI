/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { useMutation, useQuery } from '@apollo/client/react';
import { useLingui } from '@lingui/react/macro';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { GET_LOCAL_SOURCE_ENTRIES } from '@/lib/graphql/localSource/LocalSourceQuery.ts';
import { RESCAN_LOCAL_SOURCE } from '@/lib/graphql/localSource/LocalSourceMutation.ts';
import type {
    GetLocalSourceEntriesQuery,
    RescanLocalSourceMutation,
    RescanLocalSourceMutationVariables,
} from '@/lib/graphql/generated/graphql.ts';
import { requestManager } from '@/lib/requests/RequestManager.ts';
import { useAppTitle } from '@/features/navigation-bar/hooks/useAppTitle.ts';
import { makeToast } from '@/base/utils/Toast.ts';
import { getErrorMessage } from '@/lib/HelperFunctions.ts';

const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    const units = ['KB', 'MB', 'GB', 'TB'];
    let value = bytes / 1024;
    let unitIdx = 0;
    while (value >= 1024 && unitIdx < units.length - 1) {
        value /= 1024;
        unitIdx += 1;
    }
    return `${value.toFixed(1)} ${units[unitIdx]}`;
};

export function LocalSourceTools() {
    const { t } = useLingui();
    useAppTitle(t`Local source`);
    const apolloClient = requestManager.graphQLClient.client;

    const { data, loading, error, refetch } = useQuery<GetLocalSourceEntriesQuery>(
        GET_LOCAL_SOURCE_ENTRIES,
        { client: apolloClient, fetchPolicy: 'cache-and-network' },
    );

    const [rescan, rescanState] = useMutation<
        RescanLocalSourceMutation,
        RescanLocalSourceMutationVariables
    >(RESCAN_LOCAL_SOURCE, { client: apolloClient });

    const entries = data?.localSourceEntries ?? [];

    const handleRescan = async () => {
        try {
            const res = await rescan({ variables: { input: {} } });
            const count = res.data?.rescanLocalSource?.imported ?? 0;
            makeToast(t`Rescanned local source · ${count} entr(y/ies) ingested`, 'success');
            refetch().catch(() => {});
        } catch (e) {
            makeToast(t`Rescan failed`, 'error', getErrorMessage(e));
        }
    };

    return (
        <Box sx={{ p: 2 }}>
            <Stack direction="row" spacing={1} sx={{ mb: 2, alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                    {t`Files dropped into the configured local source folder show up here. Use Rescan after adding files via Finder/SSH so the LocalSource extension ingests them into the library.`}
                </Typography>
                <Button variant="contained" onClick={handleRescan} disabled={rescanState.loading}>
                    {t`Rescan`}
                </Button>
            </Stack>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error.message}</Alert>}
            {rescanState.error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {rescanState.error.message}
                </Alert>
            )}

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                </Box>
            ) : entries.length === 0 ? (
                <Alert severity="info">{t`No files in the local source folder yet.`}</Alert>
            ) : (
                <List sx={{ pt: 0 }}>
                    {entries.map((entry) => (
                        <ListItem
                            key={entry.name}
                            secondaryAction={
                                <Stack direction="row" spacing={0.5}>
                                    <Chip size="small" label={entry.type} />
                                    <Chip size="small" variant="outlined" label={formatBytes(Number(entry.sizeBytes))} />
                                </Stack>
                            }
                        >
                            <ListItemText
                                primary={entry.name}
                                secondary={
                                    entry.type === 'folder'
                                        ? t`${entry.itemCount} item(s) · modified ${new Date(Number(entry.lastModified)).toLocaleString()}`
                                        : t`Modified ${new Date(Number(entry.lastModified)).toLocaleString()}`
                                }
                            />
                        </ListItem>
                    ))}
                </List>
            )}
        </Box>
    );
}
