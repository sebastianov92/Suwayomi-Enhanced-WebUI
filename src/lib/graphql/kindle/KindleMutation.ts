/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import gql from 'graphql-tag';

export const SEND_CHAPTER_TO_KINDLE = gql`
    mutation SEND_CHAPTER_TO_KINDLE($input: SendChapterToKindleInput!) {
        sendChapterToKindle(input: $input) {
            queueEntryId
            alreadyQueued
        }
    }
`;

export const CANCEL_KINDLE_QUEUE_ENTRY = gql`
    mutation CANCEL_KINDLE_QUEUE_ENTRY($input: CancelKindleQueueEntryInput!) {
        cancelKindleQueueEntry(input: $input) {
            cancelled
        }
    }
`;

export const RETRY_KINDLE_QUEUE_ENTRY = gql`
    mutation RETRY_KINDLE_QUEUE_ENTRY($input: RetryKindleQueueEntryInput!) {
        retryKindleQueueEntry(input: $input) {
            retried
        }
    }
`;

export const SET_MANGA_KINDLE_CONFIG = gql`
    mutation SET_MANGA_KINDLE_CONFIG($input: SetMangaKindleConfigInput!) {
        setMangaKindleConfig(input: $input) {
            mangaId
            autoSend
            destination
        }
    }
`;

export const SET_SMTP_PASSWORD = gql`
    mutation SET_SMTP_PASSWORD($input: SetSmtpPasswordInput!) {
        setSmtpPassword(input: $input) {
            saved
        }
    }
`;

export const SEND_TEST_EMAIL = gql`
    mutation SEND_TEST_EMAIL($input: SendTestEmailInput!) {
        sendTestEmail(input: $input) {
            sent
            message
        }
    }
`;
