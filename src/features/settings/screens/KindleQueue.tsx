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
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import ReplayIcon from '@mui/icons-material/Replay';
import { GET_KINDLE_QUEUE } from '@/lib/graphql/kindle/KindleQuery.ts';
import {
    CANCEL_KINDLE_QUEUE_ENTRY,
    RETRY_KINDLE_QUEUE_ENTRY,
} from '@/lib/graphql/kindle/KindleMutation.ts';
import type {
    CancelKindleQueueEntryMutation,
    CancelKindleQueueEntryMutationVariables,
    GetKindleQueueQuery,
    RetryKindleQueueEntryMutation,
    RetryKindleQueueEntryMutationVariables,
} from '@/lib/graphql/generated/graphql.ts';
import { requestManager } from '@/lib/requests/RequestManager.ts';
import { useAppTitle } from '@/features/navigation-bar/hooks/useAppTitle.ts';
import { makeToast } from '@/base/utils/Toast.ts';
import { getErrorMessage } from '@/lib/HelperFunctions.ts';

const STATUS_COLOR: Record<string, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
    PENDING: 'info',
    SENDING: 'warning',
    SENT: 'success',
    FAILED: 'error',
    TOO_LARGE: 'error',
};

export function KindleQueue() {
    const { t } = useLingui();
    useAppTitle(t`Kindle queue`);
    const apolloClient = requestManager.graphQLClient.client;

    const { data, loading, error, refetch } = useQuery<GetKindleQueueQuery>(GET_KINDLE_QUEUE, {
        client: apolloClient,
        fetchPolicy: 'cache-and-network',
        pollInterval: 8000,
    });

    const [cancel] = useMutation<
        CancelKindleQueueEntryMutation,
        CancelKindleQueueEntryMutationVariables
    >(CANCEL_KINDLE_QUEUE_ENTRY, { client: apolloClient });
    const [retry] = useMutation<
        RetryKindleQueueEntryMutation,
        RetryKindleQueueEntryMutationVariables
    >(RETRY_KINDLE_QUEUE_ENTRY, { client: apolloClient });

    const rows = data?.kindleQueue ?? [];

    return (
        <Box sx={{ p: 2 }}>
            <Stack direction="row" spacing={1} sx={{ mb: 2, alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                    {t`Chapters waiting to be sent to your Kindle. The worker drains the queue with the configured throttle.`}
                </Typography>
                <Tooltip title={t`Refresh`}>
                    <IconButton onClick={() => refetch().catch(() => {})}>
                        <RefreshIcon />
                    </IconButton>
                </Tooltip>
            </Stack>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error.message}</Alert>}

            {!loading && rows.length === 0 ? (
                <Alert severity="info">{t`Queue is empty.`}</Alert>
            ) : (
                <List sx={{ pt: 0 }}>
                    {rows.map((r) => (
                        <ListItem
                            key={r.id}
                            secondaryAction={
                                <Stack direction="row" spacing={0.5}>
                                    <Tooltip title={t`Retry`}>
                                        <span>
                                            <IconButton
                                                edge="end"
                                                disabled={r.status !== 'FAILED' && r.status !== 'TOO_LARGE'}
                                                onClick={async () => {
                                                    try {
                                                        await retry({ variables: { input: { id: r.id } } });
                                                        await refetch();
                                                    } catch (e) {
                                                        makeToast(t`Retry failed`, 'error', getErrorMessage(e));
                                                    }
                                                }}
                                            >
                                                <ReplayIcon />
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                    <Tooltip title={t`Remove from queue`}>
                                        <IconButton
                                            edge="end"
                                            onClick={async () => {
                                                try {
                                                    await cancel({ variables: { input: { id: r.id } } });
                                                    await refetch();
                                                } catch (e) {
                                                    makeToast(t`Cancel failed`, 'error', getErrorMessage(e));
                                                }
                                            }}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </Tooltip>
                                </Stack>
                            }
                        >
                            <ListItemText
                                primary={`${r.mangaTitle} — ${r.chapterName}`}
                                secondary={
                                    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                                        <Chip
                                            size="small"
                                            color={STATUS_COLOR[r.status] ?? 'default'}
                                            label={r.status}
                                        />
                                        <Chip size="small" variant="outlined" label={r.triggerSource} />
                                        {r.attempts > 0 && (
                                            <Chip size="small" variant="outlined" label={`attempts: ${r.attempts}`} />
                                        )}
                                        {r.destination && (
                                            <Typography variant="caption" color="text.secondary">
                                                → {r.destination}
                                            </Typography>
                                        )}
                                        {r.lastError && (
                                            <Typography variant="caption" color="error" sx={{ width: '100%' }}>
                                                {r.lastError}
                                            </Typography>
                                        )}
                                    </Stack>
                                }
                            />
                        </ListItem>
                    ))}
                </List>
            )}

            <Box sx={{ pt: 2 }}>
                <Button variant="outlined" onClick={() => refetch().catch(() => {})}>
                    {t`Refresh now`}
                </Button>
            </Box>
        </Box>
    );
}
