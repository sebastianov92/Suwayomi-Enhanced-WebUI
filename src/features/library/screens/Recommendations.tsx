/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { useQuery } from '@apollo/client/react';
import { useLingui } from '@lingui/react/macro';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { GET_LIBRARY_RECOMMENDATIONS } from '@/lib/graphql/recommendations/RecommendationsQuery.ts';
import type {
    GetLibraryRecommendationsQuery,
    GetLibraryRecommendationsQueryVariables,
} from '@/lib/graphql/generated/graphql.ts';
import { requestManager } from '@/lib/requests/RequestManager.ts';
import { useAppTitle } from '@/features/navigation-bar/hooks/useAppTitle.ts';

const stripHtml = (s?: string | null) => (s ? s.replace(/<[^>]+>/g, '').trim() : '');

export function Recommendations() {
    const { t } = useLingui();
    useAppTitle(t`Recommendations`);
    const apolloClient = requestManager.graphQLClient.client;

    const { data, loading, error } = useQuery<
        GetLibraryRecommendationsQuery,
        GetLibraryRecommendationsQueryVariables
    >(GET_LIBRARY_RECOMMENDATIONS, {
        client: apolloClient,
        variables: { perMangaLimit: 5, totalLimit: 60 },
        fetchPolicy: 'cache-and-network',
    });

    const recs = data?.libraryRecommendations ?? [];

    return (
        <Box sx={{ p: 2, maxWidth: 1100, mx: 'auto' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t`Pulled from AniList for the manga in your library that have an AniList track record. Connect AniList tracking on a manga to seed more.`}
            </Typography>

            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                </Box>
            )}

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error.message}
                </Alert>
            )}

            {!loading && !error && recs.length === 0 && (
                <Alert severity="info">
                    {t`No recommendations yet. Track at least one library manga on AniList to start getting suggestions.`}
                </Alert>
            )}

            <Stack spacing={1}>
                {recs.map((r) => (
                    <Card key={r.anilistId}>
                        <CardActionArea
                            component="a"
                            href={r.anilistUrl ?? `https://anilist.co/manga/${r.anilistId}`}
                            target="_blank"
                            rel="noopener"
                            sx={{ display: 'flex', alignItems: 'stretch' }}
                        >
                            <Avatar
                                variant="rounded"
                                src={r.coverUrl ?? undefined}
                                alt={r.title}
                                sx={{ width: 80, height: 120, m: 1, flexShrink: 0, bgcolor: 'background.default' }}
                            />
                            <CardContent sx={{ flex: 1, minWidth: 0 }}>
                                <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline', flexWrap: 'wrap' }}>
                                    <Typography variant="subtitle1" sx={{ flex: 1, minWidth: 0 }} noWrap>
                                        {r.title}
                                    </Typography>
                                    {typeof r.averageScore === 'number' && (
                                        <Chip size="small" label={`★ ${r.averageScore}`} />
                                    )}
                                    {typeof r.rating === 'number' && r.rating > 0 && (
                                        <Chip size="small" variant="outlined" label={`+${r.rating}`} />
                                    )}
                                </Stack>
                                {r.sourceMangaTitle && (
                                    <Typography variant="caption" color="text.secondary">
                                        {t`Because you read ${r.sourceMangaTitle}`}
                                    </Typography>
                                )}
                                {r.genres && r.genres.length > 0 && (
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }} noWrap>
                                        {r.genres.join(', ')}
                                    </Typography>
                                )}
                                {r.description && (
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{
                                            mt: 0.5,
                                            display: '-webkit-box',
                                            WebkitLineClamp: 3,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                        }}
                                    >
                                        {stripHtml(r.description)}
                                    </Typography>
                                )}
                            </CardContent>
                        </CardActionArea>
                    </Card>
                ))}
            </Stack>
        </Box>
    );
}
