/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import gql from 'graphql-tag';

export const GET_LOCAL_SOURCE_ENTRIES = gql`
    query GET_LOCAL_SOURCE_ENTRIES {
        localSourceEntries {
            name
            type
            sizeBytes
            itemCount
            lastModified
        }
    }
`;
