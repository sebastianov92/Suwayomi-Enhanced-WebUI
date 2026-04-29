/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { useLingui } from '@lingui/react/macro';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router-dom';
import Link from '@mui/material/Link';
import { ADD_MANGA_FROM_URL } from '@/lib/graphql/mangaUrl/MangaUrlMutation.ts';
import type {
    AddMangaFromUrlMutation,
    AddMangaFromUrlMutationVariables,
} from '@/lib/graphql/generated/graphql.ts';
import { requestManager } from '@/lib/requests/RequestManager.ts';
import { AppRoutes } from '@/base/AppRoute.constants.ts';

const STATUS_TO_SEVERITY: Record<string, 'success' | 'info' | 'warning' | 'error'> = {
    FOUND: 'success',
    EXTENSION_INSTALLED: 'success',
    NO_SOURCE_FOR_URL: 'warning',
    INVALID_URL: 'error',
};

export function AddMangaByUrl() {
    const { t } = useLingui();
    const apolloClient = requestManager.graphQLClient.client;

    const [url, setUrl] = useState('');
    const [autoInstall, setAutoInstall] = useState(true);
    const [addToLibrary, setAddToLibrary] = useState(true);

    const [addManga, { loading, data, error, reset }] = useMutation<
        AddMangaFromUrlMutation,
        AddMangaFromUrlMutationVariables
    >(ADD_MANGA_FROM_URL, { client: apolloClient });

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = url.trim();
        if (!trimmed) return;
        await addManga({
            variables: {
                input: {
                    url: trimmed,
                    autoInstallExtension: autoInstall,
                    addToLibrary,
                },
            },
        });
    };

    const result = data?.addMangaFromUrl;
    const severity = result ? STATUS_TO_SEVERITY[result.status] ?? 'info' : null;

    return (
        <Box sx={{ p: 2, maxWidth: 720, mx: 'auto' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t`Paste a manga URL from any supported site (MangaDex, MangaPlus, etc.). The matching extension is installed automatically if it isn't already, and the manga is added to your library.`}
            </Typography>

            <form onSubmit={submit}>
                <Stack spacing={2}>
                    <TextField
                        autoFocus
                        fullWidth
                        label={t`Manga URL`}
                        placeholder="https://mangadex.org/title/..."
                        value={url}
                        onChange={(e) => {
                            setUrl(e.target.value);
                            reset();
                        }}
                        disabled={loading}
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={autoInstall}
                                onChange={(e) => setAutoInstall(e.target.checked)}
                                disabled={loading}
                            />
                        }
                        label={t`Install matching extension if not present`}
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={addToLibrary}
                                onChange={(e) => setAddToLibrary(e.target.checked)}
                                disabled={loading}
                            />
                        }
                        label={t`Add to library`}
                    />
                    <Button type="submit" variant="contained" disabled={loading || !url.trim()}>
                        {t`Add manga`}
                    </Button>
                </Stack>
            </form>

            {loading && <LinearProgress sx={{ mt: 2 }} />}

            {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                    {error.message}
                </Alert>
            )}

            {result && severity && (
                <Alert severity={severity} sx={{ mt: 2 }}>
                    <Typography variant="body2" component="div">
                        <strong>{result.status}</strong>
                        {result.message && <> — {result.message}</>}
                    </Typography>
                    {result.installedExtensionPkgName && (
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                            {t`Installed extension: ${result.installedExtensionPkgName}`}
                        </Typography>
                    )}
                    {result.manga && (
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                            <Link
                                component={RouterLink}
                                to={AppRoutes.manga.path(result.manga.id)}
                            >
                                {result.manga.title}
                            </Link>
                            {result.manga.author && <> — {result.manga.author}</>}
                        </Typography>
                    )}
                    {result.duplicates && result.duplicates.length > 0 && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            {t`Possible duplicates already in your library:`}
                            <ul style={{ marginTop: 4, marginBottom: 0 }}>
                                {result.duplicates.map((d) => (
                                    <li key={d.id}>
                                        <Link
                                            component={RouterLink}
                                            to={AppRoutes.manga.path(d.id)}
                                        >
                                            {d.title}
                                        </Link>
                                        {d.author && ` — ${d.author}`}
                                    </li>
                                ))}
                            </ul>
                        </Typography>
                    )}
                </Alert>
            )}
        </Box>
    );
}
