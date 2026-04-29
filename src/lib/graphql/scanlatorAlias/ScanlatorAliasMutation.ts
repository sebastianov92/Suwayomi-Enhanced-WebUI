/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import gql from 'graphql-tag';
import { SCANLATOR_ALIAS_FIELDS } from '@/lib/graphql/scanlatorAlias/ScanlatorAliasFragments.ts';

export const CREATE_SCANLATOR_ALIAS = gql`
    ${SCANLATOR_ALIAS_FIELDS}
    mutation CREATE_SCANLATOR_ALIAS($input: CreateScanlatorAliasInput!) {
        createScanlatorAlias(input: $input) {
            scanlatorAlias {
                ...SCANLATOR_ALIAS_FIELDS
            }
        }
    }
`;

export const UPDATE_SCANLATOR_ALIAS = gql`
    ${SCANLATOR_ALIAS_FIELDS}
    mutation UPDATE_SCANLATOR_ALIAS($input: UpdateScanlatorAliasInput!) {
        updateScanlatorAlias(input: $input) {
            scanlatorAlias {
                ...SCANLATOR_ALIAS_FIELDS
            }
        }
    }
`;

export const DELETE_SCANLATOR_ALIAS = gql`
    mutation DELETE_SCANLATOR_ALIAS($input: DeleteScanlatorAliasInput!) {
        deleteScanlatorAlias(input: $input) {
            deleted
        }
    }
`;
