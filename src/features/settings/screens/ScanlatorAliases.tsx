/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import { useLingui } from '@lingui/react/macro';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import {
    CREATE_SCANLATOR_ALIAS,
    DELETE_SCANLATOR_ALIAS,
    UPDATE_SCANLATOR_ALIAS,
} from '@/lib/graphql/scanlatorAlias/ScanlatorAliasMutation.ts';
import {
    GET_DISTINCT_SCANLATORS,
    GET_SCANLATOR_ALIASES,
} from '@/lib/graphql/scanlatorAlias/ScanlatorAliasQuery.ts';
import type {
    CreateScanlatorAliasMutation,
    CreateScanlatorAliasMutationVariables,
    DeleteScanlatorAliasMutation,
    DeleteScanlatorAliasMutationVariables,
    GetDistinctScanlatorsQuery,
    GetDistinctScanlatorsQueryVariables,
    GetScanlatorAliasesQuery,
    UpdateScanlatorAliasMutation,
    UpdateScanlatorAliasMutationVariables,
} from '@/lib/graphql/generated/graphql.ts';
import { useAppTitle } from '@/features/navigation-bar/hooks/useAppTitle.ts';

type EditTarget = {
    scanlator: string;
    aliasId?: number;
    displayName: string;
};

export function ScanlatorAliases() {
    const { t } = useLingui();
    useAppTitle(t`Scanlator aliases`);

    const distinctQuery = useQuery<GetDistinctScanlatorsQuery, GetDistinctScanlatorsQueryVariables>(
        GET_DISTINCT_SCANLATORS,
        { variables: { inLibraryOnly: false } },
    );
    const aliasesQuery = useQuery<GetScanlatorAliasesQuery>(GET_SCANLATOR_ALIASES);

    const [createAlias, createState] = useMutation<
        CreateScanlatorAliasMutation,
        CreateScanlatorAliasMutationVariables
    >(CREATE_SCANLATOR_ALIAS, {
        refetchQueries: [GET_DISTINCT_SCANLATORS, GET_SCANLATOR_ALIASES],
    });
    const [updateAlias, updateState] = useMutation<
        UpdateScanlatorAliasMutation,
        UpdateScanlatorAliasMutationVariables
    >(UPDATE_SCANLATOR_ALIAS, {
        refetchQueries: [GET_DISTINCT_SCANLATORS, GET_SCANLATOR_ALIASES],
    });
    const [deleteAlias, deleteState] = useMutation<
        DeleteScanlatorAliasMutation,
        DeleteScanlatorAliasMutationVariables
    >(DELETE_SCANLATOR_ALIAS, {
        refetchQueries: [GET_DISTINCT_SCANLATORS, GET_SCANLATOR_ALIASES],
    });

    const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
    const [editValue, setEditValue] = useState('');

    const aliasByScanlator = useMemo(() => {
        const map = new Map<string, { id: number; displayName: string }>();
        aliasesQuery.data?.scanlatorAliases.nodes.forEach((node) => {
            map.set(node.scanlator, { id: node.id, displayName: node.displayName });
        });
        return map;
    }, [aliasesQuery.data]);

    const orphanedAliases = useMemo(() => {
        const seenScanlators = new Set(distinctQuery.data?.distinctScanlators.map((d) => d.scanlator));
        return (aliasesQuery.data?.scanlatorAliases.nodes ?? []).filter((n) => !seenScanlators.has(n.scanlator));
    }, [aliasesQuery.data, distinctQuery.data]);

    const openEditor = (target: EditTarget) => {
        setEditTarget(target);
        setEditValue(target.displayName);
    };

    const closeEditor = () => {
        setEditTarget(null);
        setEditValue('');
    };

    const submitEditor = async () => {
        if (!editTarget) return;
        const trimmed = editValue.trim();
        if (!trimmed) return;
        if (editTarget.aliasId != null) {
            await updateAlias({
                variables: { input: { id: editTarget.aliasId, patch: { displayName: trimmed } } },
            });
        } else {
            await createAlias({
                variables: { input: { scanlator: editTarget.scanlator, displayName: trimmed } },
            });
        }
        closeEditor();
    };

    const handleDelete = async (aliasId: number) => {
        await deleteAlias({ variables: { input: { id: aliasId } } });
    };

    const isLoading = distinctQuery.loading || aliasesQuery.loading;
    const mutationError = createState.error ?? updateState.error ?? deleteState.error;

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t`Map a scanlator string from your downloads to a friendly name. The alias is used when building the chapter folder name (and CBZ filename) on disk. Existing downloads are not renamed.`}
            </Typography>

            {mutationError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {mutationError.message}
                </Alert>
            )}

            {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <List
                    sx={{ pt: 0 }}
                    subheader={
                        <ListSubheader disableSticky>
                            {t`Detected scanlators`}
                        </ListSubheader>
                    }
                >
                    {(distinctQuery.data?.distinctScanlators ?? []).length === 0 && (
                        <ListItem>
                            <ListItemText
                                primary={t`No scanlators found yet`}
                                secondary={t`Once you have chapters in the database, the scanlators they declare will appear here.`}
                            />
                        </ListItem>
                    )}
                    {(distinctQuery.data?.distinctScanlators ?? []).map((entry) => {
                        const alias = aliasByScanlator.get(entry.scanlator);
                        return (
                            <ListItem
                                key={entry.scanlator}
                                secondaryAction={
                                    <Stack direction="row" spacing={0.5}>
                                        <Tooltip title={alias ? t`Edit alias` : t`Create alias`}>
                                            <IconButton
                                                edge="end"
                                                onClick={() =>
                                                    openEditor({
                                                        scanlator: entry.scanlator,
                                                        aliasId: alias?.id,
                                                        displayName: alias?.displayName ?? entry.scanlator,
                                                    })
                                                }
                                            >
                                                <EditIcon />
                                            </IconButton>
                                        </Tooltip>
                                        {alias && (
                                            <Tooltip title={t`Remove alias`}>
                                                <IconButton edge="end" onClick={() => handleDelete(alias.id)}>
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    </Stack>
                                }
                            >
                                <ListItemText
                                    primary={alias ? `${alias.displayName} → ${entry.scanlator}` : entry.scanlator}
                                    secondary={t`${entry.chapterCount} chapter(s)`}
                                />
                            </ListItem>
                        );
                    })}

                    {orphanedAliases.length > 0 && (
                        <>
                            <ListSubheader disableSticky>{t`Orphaned aliases`}</ListSubheader>
                            <ListItem>
                                <ListItemText
                                    secondary={t`These aliases reference scanlators that no longer appear in any chapter. They are still used if a matching chapter shows up later.`}
                                />
                            </ListItem>
                            {orphanedAliases.map((alias) => (
                                <ListItem
                                    key={alias.id}
                                    secondaryAction={
                                        <Stack direction="row" spacing={0.5}>
                                            <Tooltip title={t`Edit alias`}>
                                                <IconButton
                                                    edge="end"
                                                    onClick={() =>
                                                        openEditor({
                                                            scanlator: alias.scanlator,
                                                            aliasId: alias.id,
                                                            displayName: alias.displayName,
                                                        })
                                                    }
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title={t`Remove alias`}>
                                                <IconButton edge="end" onClick={() => handleDelete(alias.id)}>
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </Stack>
                                    }
                                >
                                    <ListItemText primary={`${alias.displayName} → ${alias.scanlator}`} />
                                </ListItem>
                            ))}
                        </>
                    )}
                </List>
            )}

            <Dialog open={editTarget != null} onClose={closeEditor} fullWidth maxWidth="sm">
                <DialogTitle>
                    {editTarget?.aliasId != null ? t`Edit scanlator alias` : t`Create scanlator alias`}
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {t`Source scanlator: ${editTarget?.scanlator ?? ''}`}
                    </Typography>
                    <TextField
                        autoFocus
                        fullWidth
                        label={t`Display name`}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                submitEditor();
                            }
                        }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeEditor}>{t`Cancel`}</Button>
                    <Button
                        variant="contained"
                        onClick={submitEditor}
                        disabled={!editValue.trim()}
                    >
                        {t`Save`}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
