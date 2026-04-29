/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import gql from 'graphql-tag';

const RECOMMENDATION_FIELDS = gql`
    fragment RECOMMENDATION_FIELDS on RecommendationEntry {
        anilistId
        title
        coverUrl
        description
        genres
        averageScore
        rating
        anilistUrl
        sourceMangaId
        sourceMangaTitle
    }
`;

export const GET_MANGA_RECOMMENDATIONS = gql`
    ${RECOMMENDATION_FIELDS}
    query GET_MANGA_RECOMMENDATIONS($mangaId: Int!) {
        mangaRecommendations(mangaId: $mangaId) {
            ...RECOMMENDATION_FIELDS
        }
    }
`;

export const GET_LIBRARY_RECOMMENDATIONS = gql`
    ${RECOMMENDATION_FIELDS}
    query GET_LIBRARY_RECOMMENDATIONS($perMangaLimit: Int, $totalLimit: Int) {
        libraryRecommendations(perMangaLimit: $perMangaLimit, totalLimit: $totalLimit) {
            ...RECOMMENDATION_FIELDS
        }
    }
`;
