/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import gql from 'graphql-tag';

export const GET_KINDLE_QUEUE = gql`
    query GET_KINDLE_QUEUE {
        kindleQueue {
            id
            chapterId
            mangaId
            mangaTitle
            chapterName
            status
            attempts
            triggerSource
            destination
            lastError
            enqueuedAt
            lastAttemptAt
            nextAttemptAt
        }
    }
`;

export const GET_EMAIL_PRESETS = gql`
    query GET_EMAIL_PRESETS {
        emailPresets {
            id
            displayName
            host
            port
            useStartTls
        }
    }
`;

export const GET_MANGA_KINDLE_CONFIG = gql`
    query GET_MANGA_KINDLE_CONFIG($mangaId: Int!) {
        mangaKindleConfig(mangaId: $mangaId) {
            mangaId
            autoSend
            destination
        }
    }
`;
