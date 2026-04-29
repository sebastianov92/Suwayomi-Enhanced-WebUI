/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import gql from 'graphql-tag';

export const SEARCH_LIBRARY = gql`
    query SEARCH_LIBRARY(
        $query: String!
        $inLibraryOnly: Boolean
        $searchTitle: Boolean
        $searchAuthor: Boolean
        $searchArtist: Boolean
        $searchDescription: Boolean
        $searchGenre: Boolean
        $limit: Int
    ) {
        searchLibrary(
            query: $query
            inLibraryOnly: $inLibraryOnly
            searchTitle: $searchTitle
            searchAuthor: $searchAuthor
            searchArtist: $searchArtist
            searchDescription: $searchDescription
            searchGenre: $searchGenre
            limit: $limit
        ) {
            id
            title
            author
            artist
            inLibrary
            thumbnailUrl
            genre
        }
    }
`;
