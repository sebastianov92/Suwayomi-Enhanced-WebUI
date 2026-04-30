/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import { useLingui } from '@lingui/react/macro';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { GET_MANGA_KINDLE_CONFIG } from '@/lib/graphql/kindle/KindleQuery.ts';
import { SET_MANGA_KINDLE_CONFIG } from '@/lib/graphql/kindle/KindleMutation.ts';
import type {
    GetMangaKindleConfigQuery,
    GetMangaKindleConfigQueryVariables,
    SetMangaKindleConfigMutation,
    SetMangaKindleConfigMutationVariables,
} from '@/lib/graphql/generated/graphql.ts';
import { requestManager } from '@/lib/requests/RequestManager.ts';
import { makeToast } from '@/base/utils/Toast.ts';
import { getErrorMessage } from '@/lib/HelperFunctions.ts';

type Props = {
    open: boolean;
    onClose: () => void;
    mangaId: number;
};

export function MangaKindleConfigDialog({ open, onClose, mangaId }: Props) {
    const { t } = useLingui();
    const apolloClient = requestManager.graphQLClient.client;

    const cfgQuery = useQuery<GetMangaKindleConfigQuery, GetMangaKindleConfigQueryVariables>(
        GET_MANGA_KINDLE_CONFIG,
        { client: apolloClient, variables: { mangaId }, skip: !open, fetchPolicy: 'cache-and-network' },
    );

    const [setCfg, setCfgState] = useMutation<
        SetMangaKindleConfigMutation,
        SetMangaKindleConfigMutationVariables
    >(SET_MANGA_KINDLE_CONFIG, {
        client: apolloClient,
        refetchQueries: [{ query: GET_MANGA_KINDLE_CONFIG, variables: { mangaId } }],
    });

    const [autoSend, setAutoSend] = useState(false);
    const [destination, setDestination] = useState('');

    useEffect(() => {
        if (!open) return;
        const c = cfgQuery.data?.mangaKindleConfig;
        setAutoSend(c?.autoSend ?? false);
        setDestination(c?.destination ?? '');
    }, [open, cfgQuery.data]);

    const handleSave = async () => {
        try {
            await setCfg({
                variables: {
                    input: {
                        mangaId,
                        autoSend,
                        destination: destination.trim() || null,
                    },
                },
            });
            onClose();
        } catch (e) {
            makeToast(t`Failed to save`, 'error', getErrorMessage(e));
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>{t`Send to Kindle`}</DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {t`Per-manga Kindle delivery settings. Requires SMTP to be configured in Settings → Send to Kindle.`}
                </Typography>

                {setCfgState.error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {setCfgState.error.message}
                    </Alert>
                )}

                <Stack spacing={2}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={autoSend}
                                onChange={(_, checked) => setAutoSend(checked)}
                            />
                        }
                        label={t`Auto-send new chapters to Kindle`}
                    />
                    <TextField
                        size="small"
                        fullWidth
                        label={t`Override destination email (optional)`}
                        placeholder={t`Leave empty to use the global Kindle email`}
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                    />
                    <Box>
                        <Typography variant="caption" color="text.secondary">
                            {t`Manual sends from the chapter menu work regardless of this toggle.`}
                        </Typography>
                    </Box>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>{t`Cancel`}</Button>
                <Button variant="contained" onClick={handleSave} disabled={setCfgState.loading}>
                    {t`Save`}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
