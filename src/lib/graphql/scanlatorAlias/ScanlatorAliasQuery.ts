/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import gql from 'graphql-tag';
import { SCANLATOR_ALIAS_FIELDS } from '@/lib/graphql/scanlatorAlias/ScanlatorAliasFragments.ts';

export const GET_SCANLATOR_ALIASES = gql`
    ${SCANLATOR_ALIAS_FIELDS}
    query GET_SCANLATOR_ALIASES {
        scanlatorAliases {
            totalCount
            nodes {
                ...SCANLATOR_ALIAS_FIELDS
            }
        }
    }
`;

export const GET_DISTINCT_SCANLATORS = gql`
    query GET_DISTINCT_SCANLATORS($inLibraryOnly: Boolean) {
        distinctScanlators(inLibraryOnly: $inLibraryOnly) {
            scanlator
            chapterCount
            currentAlias
        }
    }
`;
