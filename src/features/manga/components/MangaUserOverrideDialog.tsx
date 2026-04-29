/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import { useLingui } from '@lingui/react/macro';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import {
    CLEAR_MANGA_CUSTOM_COVER,
    CLEAR_MANGA_USER_OVERRIDE,
    SET_MANGA_CUSTOM_COVER,
    SET_MANGA_USER_OVERRIDE,
} from '@/lib/graphql/mangaUserOverride/MangaUserOverrideMutation.ts';
import { GET_MANGA_USER_OVERRIDE } from '@/lib/graphql/mangaUserOverride/MangaUserOverrideQuery.ts';
import type {
    ClearMangaCustomCoverMutation,
    ClearMangaCustomCoverMutationVariables,
    ClearMangaUserOverrideMutation,
    ClearMangaUserOverrideMutationVariables,
    GetMangaUserOverrideQuery,
    GetMangaUserOverrideQueryVariables,
    SetMangaCustomCoverMutation,
    SetMangaCustomCoverMutationVariables,
    SetMangaUserOverrideMutation,
    SetMangaUserOverrideMutationVariables,
} from '@/lib/graphql/generated/graphql.ts';
import { requestManager } from '@/lib/requests/RequestManager.ts';

type Props = {
    open: boolean;
    onClose: () => void;
    mangaId: number;
    initialTitle?: string;
    initialAuthor?: string | null;
    initialArtist?: string | null;
    initialDescription?: string | null;
    initialGenre?: string[];
};

export function MangaUserOverrideDialog({
    open,
    onClose,
    mangaId,
    initialTitle,
    initialAuthor,
    initialArtist,
    initialDescription,
    initialGenre,
}: Props) {
    const { t } = useLingui();
    const apolloClient = requestManager.graphQLClient.client;

    const overrideQuery = useQuery<GetMangaUserOverrideQuery, GetMangaUserOverrideQueryVariables>(
        GET_MANGA_USER_OVERRIDE,
        { client: apolloClient, variables: { mangaId }, skip: !open, fetchPolicy: 'cache-and-network' },
    );

    const [title, setTitle] = useState('');
    const [author, setAuthor] = useState('');
    const [artist, setArtist] = useState('');
    const [description, setDescription] = useState('');
    const [genre, setGenre] = useState('');
    const [notes, setNotes] = useState('');

    // Seed form with existing override (or fall back to source-provided values)
    useEffect(() => {
        if (!open) return;
        const o = overrideQuery.data?.mangaUserOverride;
        setTitle(o?.title ?? initialTitle ?? '');
        setAuthor(o?.author ?? initialAuthor ?? '');
        setArtist(o?.artist ?? initialArtist ?? '');
        setDescription(o?.description ?? initialDescription ?? '');
        setGenre((o?.genre ?? initialGenre ?? []).join(', '));
        setNotes(o?.notes ?? '');
    }, [open, overrideQuery.data, initialTitle, initialAuthor, initialArtist, initialDescription, initialGenre]);

    const refetchOptions = {
        client: apolloClient,
        refetchQueries: [{ query: GET_MANGA_USER_OVERRIDE, variables: { mangaId } }],
    };
    const [setOverride, setState] = useMutation<
        SetMangaUserOverrideMutation,
        SetMangaUserOverrideMutationVariables
    >(SET_MANGA_USER_OVERRIDE, refetchOptions);
    const [clearOverride, clearState] = useMutation<
        ClearMangaUserOverrideMutation,
        ClearMangaUserOverrideMutationVariables
    >(CLEAR_MANGA_USER_OVERRIDE, refetchOptions);
    const [setCover, setCoverState] = useMutation<
        SetMangaCustomCoverMutation,
        SetMangaCustomCoverMutationVariables
    >(SET_MANGA_CUSTOM_COVER, {
        ...refetchOptions,
        context: { hasUpload: true },
    });
    const [clearCover, clearCoverState] = useMutation<
        ClearMangaCustomCoverMutation,
        ClearMangaCustomCoverMutationVariables
    >(CLEAR_MANGA_CUSTOM_COVER, refetchOptions);

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const error =
        setState.error ?? clearState.error ?? setCoverState.error ?? clearCoverState.error;
    const busy =
        setState.loading || clearState.loading || setCoverState.loading || clearCoverState.loading;

    const handleSave = async () => {
        const splitGenre = genre
            .split(',')
            .map((g) => g.trim())
            .filter((g) => g.length > 0);
        await setOverride({
            variables: {
                input: {
                    mangaId,
                    patch: {
                        title: title.trim() || null,
                        author: author.trim() || null,
                        artist: artist.trim() || null,
                        description: description.trim() || null,
                        genre: splitGenre,
                        notes: notes.trim() || null,
                    },
                },
            },
        });
        onClose();
    };

    const handleClearAll = async () => {
        await clearOverride({ variables: { input: { mangaId } } });
        onClose();
    };

    const handleCoverPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        await setCover({ variables: { input: { mangaId, cover: file as unknown as File } } });
        e.target.value = '';
    };

    const handleClearCover = async () => {
        await clearCover({ variables: { input: { mangaId } } });
    };

    const hasCustomCover = overrideQuery.data?.mangaUserOverride?.hasCustomCover === true;

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>{t`Edit manga metadata`}</DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {t`Overrides are stored locally and won't change source data. Leave a field blank to fall back to the source value.`}
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error.message}
                    </Alert>
                )}

                <Stack spacing={2}>
                    <TextField
                        label={t`Title`}
                        fullWidth
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                    <TextField
                        label={t`Author`}
                        fullWidth
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                    />
                    <TextField
                        label={t`Artist`}
                        fullWidth
                        value={artist}
                        onChange={(e) => setArtist(e.target.value)}
                    />
                    <TextField
                        label={t`Description`}
                        fullWidth
                        multiline
                        minRows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                    <TextField
                        label={t`Genre / tags (comma-separated)`}
                        fullWidth
                        value={genre}
                        onChange={(e) => setGenre(e.target.value)}
                    />
                    <TextField
                        label={t`Personal notes`}
                        fullWidth
                        multiline
                        minRows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />

                    <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                            {t`Custom cover`}
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                            <Button
                                variant="outlined"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={busy}
                            >
                                {hasCustomCover ? t`Replace cover` : t`Upload cover`}
                            </Button>
                            {hasCustomCover && (
                                <Button color="error" onClick={handleClearCover} disabled={busy}>
                                    {t`Remove cover`}
                                </Button>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                hidden
                                onChange={handleCoverPick}
                            />
                        </Stack>
                        {hasCustomCover && (
                            <Box sx={{ mt: 1 }}>
                                <img
                                    src={`/api/v1/manga/${mangaId}/custom-cover?t=${overrideQuery.data?.mangaUserOverride?.updatedAt ?? ''}`}
                                    alt="custom cover"
                                    style={{ maxHeight: 160, borderRadius: 4 }}
                                />
                            </Box>
                        )}
                    </Box>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button color="error" onClick={handleClearAll} disabled={busy}>
                    {t`Clear all overrides`}
                </Button>
                <Box sx={{ flex: 1 }} />
                <Button onClick={onClose}>{t`Cancel`}</Button>
                <Button variant="contained" onClick={handleSave} disabled={busy}>
                    {t`Save`}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
