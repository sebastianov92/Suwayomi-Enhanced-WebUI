/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { useMemo, useState } from 'react';
import { useLazyQuery } from '@apollo/client/react';
import { useLingui } from '@lingui/react/macro';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Avatar from '@mui/material/Avatar';
import { Link as RouterLink } from 'react-router-dom';
import { SEARCH_LIBRARY } from '@/lib/graphql/librarySearch/LibrarySearchQuery.ts';
import type {
    SearchLibraryQuery,
    SearchLibraryQueryVariables,
} from '@/lib/graphql/generated/graphql.ts';
import { requestManager } from '@/lib/requests/RequestManager.ts';
import { AppRoutes } from '@/base/AppRoute.constants.ts';
import { useAppTitle } from '@/features/navigation-bar/hooks/useAppTitle.ts';

export function AdvancedLibrarySearch() {
    const { t } = useLingui();
    useAppTitle(t`Advanced search`);
    const apolloClient = requestManager.graphQLClient.client;

    const [query, setQuery] = useState('');
    const [inLibraryOnly, setInLibraryOnly] = useState(true);
    const [searchTitle, setSearchTitle] = useState(true);
    const [searchAuthor, setSearchAuthor] = useState(true);
    const [searchArtist, setSearchArtist] = useState(false);
    const [searchDescription, setSearchDescription] = useState(false);
    const [searchGenre, setSearchGenre] = useState(true);

    const [run, { data, loading, error }] = useLazyQuery<SearchLibraryQuery, SearchLibraryQueryVariables>(
        SEARCH_LIBRARY,
        { client: apolloClient, fetchPolicy: 'network-only' },
    );

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = query.trim();
        if (!trimmed) return;
        run({
            variables: {
                query: trimmed,
                inLibraryOnly,
                searchTitle,
                searchAuthor,
                searchArtist,
                searchDescription,
                searchGenre,
                limit: 200,
            },
        });
    };

    const results = data?.searchLibrary ?? [];
    const hasNoFieldChecked = useMemo(
        () => !searchTitle && !searchAuthor && !searchArtist && !searchDescription && !searchGenre,
        [searchTitle, searchAuthor, searchArtist, searchDescription, searchGenre],
    );

    return (
        <Box sx={{ p: 2, maxWidth: 960, mx: 'auto' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t`Multi-field search across your library. Tokens are AND-combined, fields are OR-combined, matching is case-insensitive (LIKE %term%).`}
            </Typography>

            <Box component="form" onSubmit={submit}>
                <Stack spacing={2}>
                    <TextField
                        autoFocus
                        fullWidth
                        label={t`Query`}
                        placeholder={t`e.g. isekai magic`}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />

                    <FormGroup row>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={inLibraryOnly}
                                    onChange={(e) => setInLibraryOnly(e.target.checked)}
                                />
                            }
                            label={t`Only mangas in my library`}
                        />
                    </FormGroup>

                    <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {t`Search in fields`}
                        </Typography>
                        <FormGroup row>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={searchTitle}
                                        onChange={(e) => setSearchTitle(e.target.checked)}
                                    />
                                }
                                label={t`Title`}
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={searchAuthor}
                                        onChange={(e) => setSearchAuthor(e.target.checked)}
                                    />
                                }
                                label={t`Author`}
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={searchArtist}
                                        onChange={(e) => setSearchArtist(e.target.checked)}
                                    />
                                }
                                label={t`Artist`}
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={searchGenre}
                                        onChange={(e) => setSearchGenre(e.target.checked)}
                                    />
                                }
                                label={t`Genre / tags`}
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={searchDescription}
                                        onChange={(e) => setSearchDescription(e.target.checked)}
                                    />
                                }
                                label={t`Description`}
                            />
                        </FormGroup>
                    </Box>

                    <Button
                        type="submit"
                        variant="contained"
                        disabled={!query.trim() || hasNoFieldChecked || loading}
                    >
                        {t`Search`}
                    </Button>
                </Stack>
            </Box>

            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <CircularProgress />
                </Box>
            )}

            {error && (
                <Typography color="error" sx={{ mt: 2 }}>
                    {error.message}
                </Typography>
            )}

            {!loading && data && (
                <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        {t`${results.length} result(s)`}
                    </Typography>
                    <Stack spacing={1}>
                        {results.map((m) => {
                            const coverUrl = m.thumbnailUrl
                                ? requestManager.getValidImgUrlFor(m.thumbnailUrl)
                                : undefined;
                            const sourceLabel = m.source
                                ? `${m.source.displayName ?? m.source.name}${m.source.lang ? ` · ${m.source.lang}` : ''}`
                                : t`Unknown source`;
                            return (
                                <Card key={m.id}>
                                    <CardActionArea
                                        component={RouterLink}
                                        to={AppRoutes.manga.path(m.id)}
                                        sx={{ display: 'flex', alignItems: 'stretch' }}
                                    >
                                        <Avatar
                                            variant="rounded"
                                            src={coverUrl}
                                            alt={m.title}
                                            sx={{
                                                width: 64,
                                                height: 96,
                                                m: 1,
                                                flexShrink: 0,
                                                bgcolor: 'background.default',
                                            }}
                                        />
                                        <CardContent sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography variant="subtitle1" noWrap>
                                                {m.title}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                                {sourceLabel}
                                            </Typography>
                                            {m.author && (
                                                <Typography variant="body2" color="text.secondary" noWrap>
                                                    {m.author}
                                                    {m.artist && m.artist !== m.author ? ` · ${m.artist}` : ''}
                                                </Typography>
                                            )}
                                            {m.genre && m.genre.length > 0 && (
                                                <Typography variant="body2" color="text.secondary" noWrap>
                                                    {m.genre.join(', ')}
                                                </Typography>
                                            )}
                                        </CardContent>
                                    </CardActionArea>
                                </Card>
                            );
                        })}
                    </Stack>
                </Box>
            )}
        </Box>
    );
}
