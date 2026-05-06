/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Link from '@mui/material/Link';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Switch from '@mui/material/Switch';
import { Trans, useLingui } from '@lingui/react/macro';
import { requestManager } from '@/lib/requests/RequestManager.ts';
import { NumberSetting } from '@/base/components/settings/NumberSetting.tsx';
import { SelectSetting } from '@/base/components/settings/SelectSetting.tsx';
import { LoadingPlaceholder } from '@/base/components/feedback/LoadingPlaceholder.tsx';
import { EmptyViewAbsoluteCentered } from '@/base/components/feedback/EmptyViewAbsoluteCentered.tsx';
import { defaultPromiseErrorHandler } from '@/lib/DefaultPromiseErrorHandler.ts';
import { makeToast } from '@/base/utils/Toast.ts';
import { getErrorMessage } from '@/lib/HelperFunctions.ts';
import { useAppTitle } from '@/features/navigation-bar/hooks/useAppTitle.ts';
import { CbzMediaType, SortOrder } from '@/lib/graphql/generated/graphql';
import type { ServerSettings as ServerSettingsType } from '@/features/settings/Settings.types.ts';

export const OpdsSettings = () => {
    const { t } = useLingui();
    useAppTitle(t`OPDS`);

    const { data, loading, error, refetch } = requestManager.useGetServerSettings({
        notifyOnNetworkStatusChange: true,
    });
    const [mutateSettings] = requestManager.useUpdateServerSettings();

    const updateSetting = <Setting extends keyof ServerSettingsType>(
        setting: Setting,
        value: ServerSettingsType[Setting],
    ) => {
        mutateSettings({ variables: { input: { settings: { [setting]: value } } } }).catch((e) =>
            makeToast(t`Failed to save changes`, 'error', getErrorMessage(e)),
        );
    };

    if (loading) {
        return <LoadingPlaceholder />;
    }
    if (error) {
        return (
            <EmptyViewAbsoluteCentered
                message={t`Unable to load data`}
                messageExtra={getErrorMessage(error)}
                retry={() => refetch().catch(defaultPromiseErrorHandler('OpdsSettings::refetch'))}
            />
        );
    }

    const s = data!.settings;
    const opdsUrl = `${requestManager.getBaseUrl()}/api/opds/v1.2`;

    return (
        <List sx={{ pt: 0 }}>
            <ListItem>
                <ListItemText
                    primary={t`OPDS catalog URL`}
                    secondary={
                        <>
                            <Link
                                component="a"
                                href={opdsUrl}
                                target="_blank"
                                rel="noopener"
                                sx={{ wordBreak: 'break-all', display: 'block', mb: 1 }}
                            >
                                {opdsUrl}
                            </Link>
                            <Trans>
                                Paste this URL into your OPDS reader (KOReader, Moon+ Reader, FBReader, etc). The
                                host/port reflects how the WebUI is currently reaching the server.
                            </Trans>
                        </>
                    }
                />
                <Button
                    size="small"
                    onClick={() => {
                        void navigator.clipboard.writeText(opdsUrl).then(
                            () => makeToast(t`OPDS URL copied`, 'success'),
                            () => makeToast(t`Could not copy`, 'error'),
                        );
                    }}
                >
                    {t`Copy`}
                </Button>
            </ListItem>
            <ListItem>
                <ListItemText
                    primary={t`Show author in OPDS entries and downloads`}
                    secondary={t`When on, the manga author appears next to series and chapter entries in OPDS readers and is prefixed to downloaded CBZ filenames. When off, the author is hidden everywhere.`}
                />
                <Switch
                    edge="end"
                    checked={s.opdsIncludeAuthorInEntry ?? false}
                    onChange={(e) => updateSetting('opdsIncludeAuthorInEntry', e.target.checked)}
                />
            </ListItem>
            <ListItem>
                <ListItemText
                    primary={t`Show scanlator as a second author`}
                    secondary={t`When on, each chapter advertises its scanlator as an additional OPDS author element. Some readers display this; others use it to suffix the entry title with " - Unknown" when no scanlator is set, so leaving this off is usually safer.`}
                />
                <Switch
                    edge="end"
                    checked={s.opdsIncludeScanlatorAsAuthor ?? false}
                    onChange={(e) => updateSetting('opdsIncludeScanlatorAsAuthor', e.target.checked)}
                />
            </ListItem>
            <ListItem>
                <ListItemText
                    primary={t`Binary file size`}
                    secondary={t`Display file sizes in binary (KiB, MiB, GiB) instead of decimal (KB, MB, GB)`}
                />
                <Switch
                    edge="end"
                    checked={s.opdsUseBinaryFileSizes}
                    onChange={(e) => updateSetting('opdsUseBinaryFileSizes', e.target.checked)}
                />
            </ListItem>
            <NumberSetting
                settingTitle={t`Items per page`}
                settingValue={s.opdsItemsPerPage.toString()}
                dialogDescription={t`Number of items per page in OPDS feeds (e.g., Library History, Manga Chapters).\nHigher values may affect client performance.`}
                value={s.opdsItemsPerPage}
                defaultValue={50}
                minValue={10}
                maxValue={5000}
                stepSize={10}
                showSlider
                valueUnit={t`item`}
                handleUpdate={(value) => updateSetting('opdsItemsPerPage', value)}
            />
            <ListItem>
                <ListItemText
                    primary={t`Enable page read progress`}
                    secondary={t`Track and update your reading progress by page for each chapter during page streaming`}
                />
                <Switch
                    edge="end"
                    checked={s.opdsEnablePageReadProgress}
                    onChange={(e) => updateSetting('opdsEnablePageReadProgress', e.target.checked)}
                />
            </ListItem>
            <ListItem>
                <ListItemText
                    primary={t`Mark chapters as read on download`}
                    secondary={t`Automatically mark chapters as read when you download them.`}
                />
                <Switch
                    edge="end"
                    checked={s.opdsMarkAsReadOnDownload}
                    onChange={(e) => updateSetting('opdsMarkAsReadOnDownload', e.target.checked)}
                />
            </ListItem>
            <ListItem>
                <ListItemText
                    primary={t`Show only unread chapters`}
                    secondary={t`Filter manga feed to display only chapters you haven’t read yet.`}
                />
                <Switch
                    edge="end"
                    checked={s.opdsShowOnlyUnreadChapters}
                    onChange={(e) => updateSetting('opdsShowOnlyUnreadChapters', e.target.checked)}
                />
            </ListItem>
            <ListItem>
                <ListItemText
                    primary={t`Show only downloaded chapters`}
                    secondary={t`Filter manga feed to display only chapters you have downloaded.`}
                />
                <Switch
                    edge="end"
                    checked={s.opdsShowOnlyDownloadedChapters}
                    onChange={(e) => updateSetting('opdsShowOnlyDownloadedChapters', e.target.checked)}
                />
            </ListItem>
            <SelectSetting<SortOrder>
                settingName={t`Chapter sort order`}
                dialogDescription={t`Choose the order in which chapters are displayed.`}
                value={s.opdsChapterSortOrder}
                values={[
                    [SortOrder.Asc, { text: t`Ascending` }],
                    [SortOrder.Desc, { text: t`Descending` }],
                ]}
                handleChange={(value) => updateSetting('opdsChapterSortOrder', value)}
            />
            <SelectSetting<CbzMediaType>
                settingName={t`CBZ MIME-Type`}
                dialogDescription={t`Controls the MimeType that Suwayomi sends in OPDS entries for CBZ archives. Also affects global CBZ download.\nModern follows recent IANA standard (2017), while LEGACY (deprecated mimetype for .cbz) and COMPATIBLE (deprecated mimetype for all comic archives) might be more compatible with older clients.`}
                value={s.opdsCbzMimetype}
                values={[
                    [CbzMediaType.Legacy, { text: t`Legacy` }],
                    [CbzMediaType.Modern, { text: t`Modern` }],
                    [CbzMediaType.Compatible, { text: t`Compatible` }],
                ]}
                handleChange={(value) => updateSetting('opdsCbzMimetype', value)}
            />
        </List>
    );
};
