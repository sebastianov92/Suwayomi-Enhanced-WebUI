/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { STABLE_EMPTY_ARRAY, STABLE_EMPTY_OBJECT } from '@/base/Base.constants.ts';
import CheckBoxOutlineBlank from '@mui/icons-material/CheckBoxOutlineBlank';
import Delete from '@mui/icons-material/Delete';
import Download from '@mui/icons-material/Download';
import SaveAlt from '@mui/icons-material/SaveAlt';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import SendIcon from '@mui/icons-material/Send';
import { useMutation as useApolloMutation } from '@apollo/client/react';
import { SEND_CHAPTER_TO_KINDLE } from '@/lib/graphql/kindle/KindleMutation.ts';
import type {
    SendChapterToKindleMutation,
    SendChapterToKindleMutationVariables,
} from '@/lib/graphql/generated/graphql.ts';
import { makeToast } from '@/base/utils/Toast.ts';
import RemoveDone from '@mui/icons-material/RemoveDone';
import Done from '@mui/icons-material/Done';
import BookmarkRemove from '@mui/icons-material/BookmarkRemove';
import BookmarkAdd from '@mui/icons-material/BookmarkAdd';
import DoneAll from '@mui/icons-material/DoneAll';
import type { ComponentProps } from 'react';
import { useMemo } from 'react';
import { useLingui } from '@lingui/react/macro';
import type { SelectableCollectionReturnType } from '@/base/collection/hooks/useSelectableCollection.ts';
import { Chapters } from '@/features/chapter/services/Chapters.ts';
import { MenuItem } from '@/base/components/menu/MenuItem.tsx';
import {
    createGetMenuItemTitle,
    createIsMenuItemDisabled,
    createShouldShowMenuItem,
} from '@/base/components/menu/Menu.utils.ts';
import { defaultPromiseErrorHandler } from '@/lib/DefaultPromiseErrorHandler.ts';
import { useMetadataServerSettings } from '@/features/settings/services/ServerSettingsMetadata.ts';
import type { ChapterCard } from '@/features/chapter/components/cards/ChapterCard.tsx';
import { requestManager } from '@/lib/requests/RequestManager.ts';
import type { GetChaptersMangaQuery } from '@/lib/graphql/generated/graphql.ts';
import { GET_CHAPTERS_MANGA } from '@/lib/graphql/chapter/ChapterQuery.ts';
import { CHAPTER_ACTION_TO_TRANSLATION } from '@/features/chapter/Chapter.constants.ts';
import type {
    ChapterAction,
    ChapterBookmarkInfo,
    ChapterDownloadInfo,
    ChapterIdInfo,
    ChapterMangaInfo,
    ChapterReadInfo,
    ChapterRealUrlInfo,
} from '@/features/chapter/Chapter.types.ts';
import { IconWebView } from '@/assets/icons/IconWebView.tsx';
import { IconBrowser } from '@/assets/icons/IconBrowser.tsx';

type BaseProps = { onClose: () => void; selectable?: boolean };

type TChapter = ChapterIdInfo &
    ChapterMangaInfo &
    ChapterDownloadInfo &
    ChapterBookmarkInfo &
    ChapterReadInfo &
    ChapterRealUrlInfo;

type SingleModeProps = {
    chapter: TChapter;
    handleSelection?: SelectableCollectionReturnType<TChapter['id']>['handleSelection'];
    canBeDownloaded: boolean;
};

type SelectModeProps = {
    selectedChapters: ComponentProps<typeof ChapterCard>['chapter'][];
};

type Props =
    | (BaseProps & SingleModeProps & PropertiesNever<SelectModeProps>)
    | (BaseProps & PropertiesNever<SingleModeProps> & SelectModeProps);

export const ChapterActionMenuItems = ({
    chapter,
    handleSelection,
    canBeDownloaded = false,
    selectedChapters = STABLE_EMPTY_ARRAY,
    onClose,
    selectable = true,
}: Props) => {
    const { t } = useLingui();

    const [sendToKindle] = useApolloMutation<
        SendChapterToKindleMutation,
        SendChapterToKindleMutationVariables
    >(SEND_CHAPTER_TO_KINDLE, { client: requestManager.graphQLClient.client });

    const isSingleMode = !!chapter;
    const { isDownloaded, isRead, isBookmarked } = chapter ?? STABLE_EMPTY_OBJECT;

    const mangaChaptersResponse = requestManager.useGetMangaChapters<GetChaptersMangaQuery>(
        GET_CHAPTERS_MANGA,
        chapter?.mangaId ?? -1,
        {
            skip: !chapter,
            fetchPolicy: 'cache-only',
        },
    );
    const allChapters = mangaChaptersResponse.data?.chapters.nodes ?? STABLE_EMPTY_ARRAY;

    const {
        settings: { deleteChaptersWithBookmark },
    } = useMetadataServerSettings();

    const getMenuItemTitle = createGetMenuItemTitle(isSingleMode, CHAPTER_ACTION_TO_TRANSLATION);
    const shouldShowMenuItem = createShouldShowMenuItem(isSingleMode);
    const isMenuItemDisabled = createIsMenuItemDisabled(isSingleMode);

    const {
        downloadableChapters,
        downloadedChapters,
        unbookmarkedChapters,
        bookmarkedChapters,
        unreadChapters,
        readChapters,
    } = useMemo(
        () => ({
            downloadableChapters: Chapters.getDownloadable(selectedChapters),
            downloadedChapters: Chapters.getDownloaded(selectedChapters),
            unbookmarkedChapters: Chapters.getNonBookmarked(selectedChapters),
            bookmarkedChapters: Chapters.getBookmarked(selectedChapters),
            unreadChapters: Chapters.getNonRead(selectedChapters),
            readChapters: Chapters.getRead(selectedChapters),
        }),
        [selectedChapters],
    );

    const handleSelect = () => {
        handleSelection?.(chapter.id, true);
        onClose();
    };

    const performAction = (action: ChapterAction | 'mark_prev_as_read', chapters: TChapter[]) => {
        const isMarkPrevAsRead = action === 'mark_prev_as_read';
        const actualAction: ChapterAction = isMarkPrevAsRead ? 'mark_as_read' : action;

        if (actualAction === 'delete' && chapter) {
            const isDeletable = Chapters.isDeletable(chapter, deleteChaptersWithBookmark);
            if (!isDeletable) {
                onClose();
                return;
            }
        }

        const getChapters = (): SingleModeProps['chapter'][] => {
            // select mode
            if (!chapter) {
                return chapters;
            }

            if (!isMarkPrevAsRead) {
                return [chapter];
            }

            const index = allChapters.findIndex(({ id: chapterId }) => chapterId === chapter.id);

            const isFirstChapter = index + 1 > allChapters.length - 1;
            if (isFirstChapter) {
                return [];
            }

            const previousChapters = allChapters.slice(index + 1);

            return Chapters.getNonRead(previousChapters);
        };

        const chaptersToUpdate = getChapters();

        if (!chaptersToUpdate.length) {
            onClose();
            return;
        }

        Chapters.performAction(actualAction, Chapters.getIds(chaptersToUpdate), {
            chapters: chaptersToUpdate,
            wasManuallyMarkedAsRead: true,
            trackProgressMangaId: chaptersToUpdate[0]?.mangaId,
        }).catch(defaultPromiseErrorHandler('ChapterActionMenuItems::performAction'));
        onClose();
    };

    return (
        <>
            {isSingleMode && selectable && (
                <MenuItem onClick={handleSelect} Icon={CheckBoxOutlineBlank} title={t`Select`} />
            )}
            {isSingleMode && (
                <>
                    <MenuItem
                        Icon={IconBrowser}
                        disabled={!chapter!.realUrl}
                        onClick={() => {
                            window.open(chapter!.realUrl!, '_blank', 'noopener,noreferrer');
                            onClose();
                        }}
                        title={t`Open in browser`}
                    />
                    <MenuItem
                        Icon={IconWebView}
                        disabled={!chapter!.realUrl}
                        onClick={() => {
                            window.open(
                                requestManager.getWebviewUrl(chapter!.realUrl!),
                                '_blank',
                                'noopener,noreferrer',
                            );
                            onClose();
                        }}
                        title={t`Open in WebView`}
                    />
                </>
            )}
            {shouldShowMenuItem(canBeDownloaded) && (
                <MenuItem
                    Icon={Download}
                    disabled={isMenuItemDisabled(!downloadableChapters.length)}
                    onClick={() => performAction('download', downloadableChapters)}
                    title={getMenuItemTitle('download', downloadableChapters.length)}
                />
            )}
            {shouldShowMenuItem(isDownloaded) && (
                <MenuItem
                    Icon={Delete}
                    disabled={isMenuItemDisabled(!downloadedChapters.length)}
                    onClick={() =>
                        performAction('delete', Chapters.getDeletable(downloadedChapters, deleteChaptersWithBookmark))
                    }
                    title={getMenuItemTitle('delete', downloadedChapters.length)}
                />
            )}
            {(() => {
                // Targets for the device/Kindle actions:
                //  - single mode: just the focused chapter when downloaded
                //  - select mode: every selected chapter that's downloaded
                const targets = isSingleMode ? (isDownloaded && chapter ? [chapter] : []) : downloadedChapters;
                const totalSelected = isSingleMode ? 1 : selectedChapters.length;
                const skipped = totalSelected - targets.length;
                // Single mode hides the items when the chapter isn't
                // downloaded (no use). Select mode keeps them visible so we
                // can still surface a toast explaining the skip.
                if (isSingleMode && targets.length === 0) return null;

                const warnSkipped = () => {
                    if (skipped > 0) {
                        makeToast(
                            t`${skipped} non-downloaded chapter(s) were skipped (download to server first)`,
                            'warning',
                        );
                    }
                };
                const noTargetsToast = () => {
                    makeToast(
                        t`Selection has no downloaded chapters. Download to server first.`,
                        'warning',
                    );
                };

                const triggerDownload = async (format: 'CBZ' | 'EPUB') => {
                    if (targets.length === 0) {
                        noTargetsToast();
                        return;
                    }
                    warnSkipped();
                    // Single chapter -> hit the per-chapter direct endpoint
                    // (preserves Content-Disposition + works with HEAD pre-flight).
                    if (targets.length === 1) {
                        const c = targets[0];
                        const path = format === 'EPUB' ? 'download.epub' : 'download';
                        const url = requestManager.getValidUrlFor(`chapter/${c.id}/${path}`);
                        const a = document.createElement('a');
                        a.href = url;
                        a.rel = 'noopener';
                        a.target = '_blank';
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        return;
                    }
                    // Bulk -> ask the server to bundle every selection into
                    // a single ZIP (override + scanlator-alias filenames are
                    // baked in server-side). Browsers happily save one big
                    // file even when they would block N small ones.
                    try {
                        const res = await fetch(requestManager.getValidUrlFor('chapter/bulk-archive'), {
                            method: 'POST',
                            credentials: 'include',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                chapterIds: targets.map((c) => c.id),
                                format,
                            }),
                        });
                        if (!res.ok) {
                            const errMsg = await res.text();
                            throw new Error(`HTTP ${res.status}: ${errMsg}`);
                        }
                        const blob = await res.blob();
                        const disposition = res.headers.get('content-disposition') ?? '';
                        const match = disposition.match(/filename="?([^";]+)"?/i);
                        const filename =
                            match?.[1] ?? `chapters-${format.toLowerCase()}.zip`;
                        const blobUrl = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = blobUrl;
                        a.download = filename;
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        setTimeout(() => URL.revokeObjectURL(blobUrl), 30_000);
                        makeToast(
                            t`Bundled ${targets.length} chapter(s) into a single ZIP`,
                            'success',
                        );
                    } catch (e) {
                        // eslint-disable-next-line no-console
                        console.warn('bulk archive download failed', e);
                        makeToast(t`Bulk download failed`, 'error');
                    }
                };

                const sendAllToKindle = async () => {
                    if (targets.length === 0) {
                        noTargetsToast();
                        return;
                    }
                    warnSkipped();
                    let queued = 0;
                    let already = 0;
                    let failed = 0;
                    for (const c of targets) {
                        try {
                            const res = await sendToKindle({ variables: { input: { chapterId: c.id } } });
                            if (res.data?.sendChapterToKindle?.alreadyQueued) {
                                already += 1;
                            } else if (res.data?.sendChapterToKindle?.queueEntryId) {
                                queued += 1;
                            } else {
                                failed += 1;
                            }
                        } catch (e) {
                            failed += 1;
                            // eslint-disable-next-line no-console
                            console.warn('sendChapterToKindle failed', e);
                        }
                    }
                    if (queued > 0) {
                        makeToast(t`Queued ${queued} chapter(s) for Kindle`, 'success');
                    }
                    if (already > 0) {
                        makeToast(t`${already} chapter(s) already in queue`, 'info');
                    }
                    if (failed > 0) {
                        makeToast(t`${failed} chapter(s) failed to queue`, 'error');
                    }
                };

                const suffix = isSingleMode ? '' : ` (${targets.length})`;
                return (
                    <>
                        <MenuItem
                            Icon={SaveAlt}
                            onClick={() => {
                                void triggerDownload('CBZ');
                                onClose();
                            }}
                            title={t`Save CBZ to this device${suffix}`}
                        />
                        <MenuItem
                            Icon={MenuBookIcon}
                            onClick={() => {
                                void triggerDownload('EPUB');
                                onClose();
                            }}
                            title={t`Save EPUB to this device${suffix}`}
                        />
                        <MenuItem
                            Icon={SendIcon}
                            onClick={async () => {
                                await sendAllToKindle();
                                onClose();
                            }}
                            title={t`Send to Kindle${suffix}`}
                        />
                    </>
                );
            })()}
            {shouldShowMenuItem(!isBookmarked) && (
                <MenuItem
                    Icon={BookmarkAdd}
                    disabled={isMenuItemDisabled(!unbookmarkedChapters.length)}
                    onClick={() => performAction('bookmark', unbookmarkedChapters)}
                    title={getMenuItemTitle('bookmark', unbookmarkedChapters.length)}
                />
            )}
            {shouldShowMenuItem(isBookmarked) && (
                <MenuItem
                    Icon={BookmarkRemove}
                    disabled={isMenuItemDisabled(!bookmarkedChapters.length)}
                    onClick={() => performAction('unbookmark', bookmarkedChapters)}
                    title={getMenuItemTitle('unbookmark', bookmarkedChapters.length)}
                />
            )}
            {shouldShowMenuItem(!isRead) && (
                <MenuItem
                    Icon={Done}
                    disabled={isMenuItemDisabled(!unreadChapters.length)}
                    onClick={() => performAction('mark_as_read', unreadChapters)}
                    title={getMenuItemTitle('mark_as_read', unreadChapters.length)}
                />
            )}
            {shouldShowMenuItem(isRead) && (
                <MenuItem
                    Icon={RemoveDone}
                    disabled={isMenuItemDisabled(!readChapters.length)}
                    onClick={() => performAction('mark_as_unread', readChapters)}
                    title={getMenuItemTitle('mark_as_unread', readChapters.length)}
                />
            )}
            {isSingleMode && (
                <MenuItem
                    onClick={() => performAction('mark_prev_as_read', [])}
                    Icon={DoneAll}
                    title={t`Mark previous as read`}
                />
            )}
        </>
    );
};
