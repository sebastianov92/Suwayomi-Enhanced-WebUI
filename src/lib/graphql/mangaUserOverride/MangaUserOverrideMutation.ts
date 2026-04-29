/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import gql from 'graphql-tag';

export const SET_MANGA_USER_OVERRIDE = gql`
    mutation SET_MANGA_USER_OVERRIDE($input: SetMangaUserOverrideInput!) {
        setMangaUserOverride(input: $input) {
            override {
                id
                mangaId
                title
                author
                artist
                description
                genre
                notes
                hasCustomCover
                customCoverUrl
                updatedAt
            }
        }
    }
`;

export const CLEAR_MANGA_USER_OVERRIDE = gql`
    mutation CLEAR_MANGA_USER_OVERRIDE($input: ClearMangaUserOverrideInput!) {
        clearMangaUserOverride(input: $input) {
            cleared
        }
    }
`;

export const SET_MANGA_CUSTOM_COVER = gql`
    mutation SET_MANGA_CUSTOM_COVER($input: SetMangaCustomCoverInput!) {
        setMangaCustomCover(input: $input) {
            override {
                id
                mangaId
                hasCustomCover
                customCoverUrl
                updatedAt
            }
        }
    }
`;

export const CLEAR_MANGA_CUSTOM_COVER = gql`
    mutation CLEAR_MANGA_CUSTOM_COVER($input: ClearMangaCustomCoverInput!) {
        clearMangaCustomCover(input: $input) {
            cleared
        }
    }
`;
