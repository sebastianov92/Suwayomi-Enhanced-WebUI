/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { Direction, PaletteBackgroundChannel, Theme, TypeBackground } from '@mui/material/styles';
import { createTheme as createMuiTheme, responsiveFontSizes, useTheme } from '@mui/material/styles';
import { useCallback } from 'react';
// oxlint-disable-next-line no-restricted-imports
import { deepmerge } from '@mui/utils';
import { complement, hsl, parseToHsl } from 'polished';
import type { HslaColor, HslColor } from 'polished/lib/types/color';
import type { AppTheme } from '@/features/theme/services/AppThemes.ts';
import { defaultPromiseErrorHandler } from '@/lib/DefaultPromiseErrorHandler.ts';
import { applyStyles } from '@/base/utils/ApplyStyles.ts';
import type { TAppThemeContext } from '@/features/theme/AppTheme.types.ts';
import { ThemeMode } from '@/features/theme/AppTheme.types.ts';
import { ThemeFontLoader } from '@/features/theme/services/ThemeFontLoader.ts';
import { coerceIn } from '@/lib/HelperFunctions.ts';
import { MediaQuery } from '@/base/utils/MediaQuery.tsx';

const SCROLLBAR_SIZE = 14;

const isNeutralColor = (color: HslColor | HslaColor): boolean => {
    const isDesaturated = color.saturation < 0.08;
    const isNearBlack = color.lightness < 0.03;
    const isNearWhite = color.lightness > 0.97;

    return isDesaturated || isNearBlack || isNearWhite;
};

const createBackgroundColors = (color: string, lightnessPaper: number, lightnessDefault: number): TypeBackground => {
    const colorHsl = parseToHsl(color);

    const saturationBoost = isNeutralColor(colorHsl) ? 0 : 0.15;
    const saturation = coerceIn(colorHsl.saturation + saturationBoost, 0, 1);

    return {
        paper: hsl(colorHsl.hue, saturation, lightnessPaper),
        default: hsl(colorHsl.hue, saturation, lightnessDefault),
    };
};

const getBackgroundColor = (
    type: 'light' | 'dark',
    appTheme: AppTheme['muiTheme'],
    theme: Theme,
    setPureBlackMode: boolean = false,
): (Partial<TypeBackground> & Partial<PaletteBackgroundChannel>) | undefined => {
    if (setPureBlackMode) {
        return {
            paper: '#000',
            default: '#000',
        };
    }

    if (type === 'light' && !!theme.colorSchemes.light) {
        if (typeof appTheme.colorSchemes?.light === 'object' && appTheme.colorSchemes.light.palette?.background) {
            return appTheme.colorSchemes.light.palette.background;
        }

        return createBackgroundColors(theme.colorSchemes.light.palette.primary.dark, 0.87, 0.93);
    }

    if (type === 'dark' && !!theme.colorSchemes.dark) {
        if (typeof appTheme.colorSchemes?.dark === 'object' && appTheme.colorSchemes.dark.palette?.background) {
            return appTheme.colorSchemes.dark.palette.background;
        }

        return createBackgroundColors(theme.colorSchemes.dark.palette.primary.dark, 0.06, 0.03);
    }

    return undefined;
};

const createAppThemeWithDynamicColors = (
    primaryColorDark: string | null | undefined,
    primaryColorLight: string | null | undefined,
    appTheme: AppTheme['muiTheme'],
): AppTheme['muiTheme'] => {
    if (!primaryColorDark || !primaryColorLight) {
        return appTheme;
    }

    return {
        ...appTheme,
        colorSchemes: {
            light: {
                palette: {
                    primary: { main: primaryColorLight },
                    secondary: { main: complement(primaryColorLight) },
                },
            },
            dark: {
                palette: {
                    primary: { main: primaryColorDark },
                    secondary: { main: complement(primaryColorDark) },
                },
            },
        },
    } satisfies AppTheme['muiTheme'];
};

const getVibrantColorForTheme = (
    palette: TAppThemeContext['dynamicColor'] | null,
    mode: Exclude<ThemeMode, ThemeMode.SYSTEM>,
): string | undefined => {
    if (!palette) {
        return undefined;
    }

    return mode === ThemeMode.LIGHT ? palette.DarkVibrant.hex : palette.LightVibrant.hex;
};

export const createAppColorTheme = (
    appTheme: AppTheme['muiTheme'],
    dynamicColor: TAppThemeContext['dynamicColor'],
    setPureBlackMode: boolean,
    mode: Exclude<ThemeMode, ThemeMode.SYSTEM>,
): AppTheme['muiTheme'] => {
    const appThemeWithDominantPrimaryColor = createAppThemeWithDynamicColors(
        dynamicColor?.average.hex,
        dynamicColor?.average.hex,
        appTheme,
    );
    const themePrimaryColorForBackground = createMuiTheme({
        ...appThemeWithDominantPrimaryColor,
        defaultColorScheme: mode,
    });

    const themeBackgroundColor = deepmerge(appThemeWithDominantPrimaryColor, {
        defaultColorScheme: mode,
        colorSchemes: {
            light: themePrimaryColorForBackground.colorSchemes?.light
                ? {
                      palette: {
                          background: getBackgroundColor(
                              'light',
                              appThemeWithDominantPrimaryColor,
                              themePrimaryColorForBackground,
                          ),
                      },
                  }
                : undefined,
            dark: themePrimaryColorForBackground.colorSchemes?.dark
                ? {
                      palette: {
                          background: getBackgroundColor(
                              'dark',
                              appThemeWithDominantPrimaryColor,
                              themePrimaryColorForBackground,
                              setPureBlackMode,
                          ),
                      },
                  }
                : undefined,
        },
    });

    const appThemeWithVibrantPrimaryColor = createAppThemeWithDynamicColors(
        getVibrantColorForTheme(dynamicColor, ThemeMode.DARK),
        getVibrantColorForTheme(dynamicColor, ThemeMode.LIGHT),
        themeBackgroundColor,
    );
    return deepmerge(themeBackgroundColor, appThemeWithVibrantPrimaryColor);
};

export const createTheme = (
    themeMode: ThemeMode,
    appTheme: AppTheme,
    pureBlackMode: boolean = false,
    direction: Direction = 'ltr',
    dynamicColor: TAppThemeContext['dynamicColor'] = null,
) => {
    const mode = MediaQuery.getThemeMode(themeMode);
    const isDarkMode = mode === ThemeMode.DARK;
    const setPureBlackMode = isDarkMode && pureBlackMode;

    const appColorTheme = createAppColorTheme(appTheme.muiTheme, dynamicColor, setPureBlackMode, mode);

    const themeForColors = createMuiTheme({ ...appColorTheme, defaultColorScheme: mode });

    // only style scrollbar for devices that support hovering; otherwise, they most likely are touch devices that should
    // use the native scrollbar.
    // this is necessary since for some reason chromium uses the native scrollbar for the window scrollbar and the
    // styled non-native scrollbar for element scrollbars on those devices
    const doesDeviceSupportHover = window.matchMedia('hover: hover').matches;

    const suwayomiTheme = createMuiTheme(
        deepmerge(appColorTheme, {
            defaultColorScheme: mode,
            direction,
            typography: {
                fontFamily: '"Outfit", "Roboto", "Helvetica", "Arial", sans-serif',
                fontSize: 14,
                fontWeightLight: 300,
                fontWeightRegular: 400,
                fontWeightMedium: 500,
                fontWeightBold: 700,
                h1: {
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                },
                h2: {
                    fontWeight: 700,
                    letterSpacing: '-0.01em',
                },
                h3: {
                    fontWeight: 600,
                    letterSpacing: '-0.01em',
                },
                h4: {
                    fontWeight: 600,
                },
                h5: {
                    fontWeight: 600,
                },
                h6: {
                    fontWeight: 600,
                    letterSpacing: '0.005em',
                },
                subtitle1: {
                    fontWeight: 500,
                },
                subtitle2: {
                    fontWeight: 500,
                    letterSpacing: '0.01em',
                },
                body1: {
                    lineHeight: 1.6,
                },
                body2: {
                    lineHeight: 1.5,
                },
                button: {
                    fontWeight: 600,
                    letterSpacing: '0.02em',
                    textTransform: 'none' as const,
                },
                caption: {
                    letterSpacing: '0.02em',
                },
                overline: {
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                },
                ...appTheme.muiTheme.typography,
            },
            shape: {
                borderRadius: 12,
            },
            components: {
                ...appTheme.muiTheme.components,
                MuiCard: {
                    styleOverrides: {
                        root: {
                            borderRadius: 12,
                            backgroundImage: 'none',
                            transition:
                                'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        },
                    },
                },
                MuiCardActionArea: {
                    styleOverrides: {
                        root: {
                            transition: 'opacity 0.2s ease',
                        },
                    },
                },
                MuiButton: {
                    styleOverrides: {
                        root: {
                            borderRadius: 10,
                            textTransform: 'none' as const,
                            fontWeight: 600,
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:active': {
                                transform: 'scale(0.98)',
                            },
                        },
                    },
                },
                MuiIconButton: {
                    styleOverrides: {
                        root: {
                            transition: 'background-color 0.2s ease, transform 0.15s ease',
                            '&:active': {
                                transform: 'scale(0.92)',
                            },
                        },
                    },
                },
                MuiListItemButton: {
                    styleOverrides: {
                        root: {
                            borderRadius: 10,
                            transition: 'background-color 0.2s ease',
                            marginBottom: 2,
                        },
                    },
                },
                MuiDrawer: {
                    styleOverrides: {
                        paper: {
                            backgroundImage: 'none',
                            borderRight: 'none',
                        },
                    },
                },
                MuiAppBar: {
                    defaultProps: {
                        // `color: 'transparent'` was zero-ing out the
                        // backgroundColor below via MuiAppBar-colorTransparent,
                        // so on mobile the page content scrolled under the
                        // header. Use 'default' so styleOverrides apply.
                        color: 'default',
                        enableColorOnDark: true,
                    },
                    styleOverrides: {
                        root: {
                            backgroundImage: 'none',
                            backgroundColor: 'var(--mui-palette-background-default)',
                            boxShadow: isDarkMode
                                ? 'inset 0 -1px 0 rgba(255,255,255,0.06)'
                                : 'inset 0 -1px 0 rgba(0,0,0,0.08)',
                            color: isDarkMode ? '#ffffff' : `${themeForColors.palette.primary.dark}`,
                        },
                        // Belt-and-suspenders: if any consumer still
                        // requests color="transparent", force the same
                        // solid background so content never scrolls
                        // through the header.
                        colorTransparent: {
                            backgroundColor: 'var(--mui-palette-background-default)',
                        },
                    },
                },
                MuiDialog: {
                    styleOverrides: {
                        paper: {
                            borderRadius: 16,
                            backgroundImage: 'none',
                        },
                    },
                },
                MuiPaper: {
                    styleOverrides: {
                        root: {
                            backgroundImage: 'none',
                        },
                    },
                },
                MuiTooltip: {
                    styleOverrides: {
                        tooltip: {
                            borderRadius: 8,
                            fontSize: '0.75rem',
                            fontWeight: 500,
                        },
                    },
                },
                MuiChip: {
                    styleOverrides: {
                        root: {
                            borderRadius: 8,
                            fontWeight: 500,
                        },
                    },
                },
                MuiUseMediaQuery: {
                    defaultProps: {
                        noSsr: true,
                    },
                },
                MuiCssBaseline: {
                    ...appTheme.muiTheme.components?.MuiCssBaseline,
                    styleOverrides:
                        typeof appTheme.muiTheme.components?.MuiCssBaseline?.styleOverrides === 'object'
                            ? {
                                  ...appTheme.muiTheme.components?.MuiCssBaseline?.styleOverrides,
                                  '*::-webkit-scrollbar': applyStyles(doesDeviceSupportHover, {
                                      width: `${SCROLLBAR_SIZE}px`,
                                      height: `${SCROLLBAR_SIZE}px`,
                                      // @ts-ignore - '*::-webkit-scrollbar' is a valid key
                                      ...appTheme.muiTheme.components?.MuiCssBaseline?.styleOverrides?.[
                                          '*::-webkit-scrollbar'
                                      ],
                                  }),
                                  '*::-webkit-scrollbar-thumb': applyStyles(doesDeviceSupportHover, {
                                      border: '4px solid rgba(0, 0, 0, 0)',
                                      backgroundClip: 'padding-box',
                                      borderRadius: '9999px',
                                      backgroundColor: `${themeForColors.palette.primary[isDarkMode ? 'dark' : 'light']}`,
                                      // @ts-ignore - '*::-webkit-scrollbar-thumb' is a valid key
                                      ...appTheme.muiTheme.components?.MuiCssBaseline?.styleOverrides?.[
                                          '*::-webkit-scrollbar-thumb'
                                      ],
                                  }),
                                  '*::-webkit-scrollbar-thumb:hover': applyStyles(doesDeviceSupportHover, {
                                      borderWidth: '2px',
                                      // @ts-ignore - '*::-webkit-scrollbar-thumb:hover' is a valid key
                                      ...appTheme.muiTheme.components?.MuiCssBaseline?.styleOverrides?.[
                                          '*::-webkit-scrollbar-thumb:hover'
                                      ],
                                  }),
                              }
                            : `
                        @media (hover: hover) {
                          *::-webkit-scrollbar {
                            width: ${SCROLLBAR_SIZE}px;
                            height: ${SCROLLBAR_SIZE}px;
                          }
                          *::-webkit-scrollbar-thumb {
                            border: 4px solid rgba(0, 0, 0, 0);
                            background-clip: padding-box;
                            border-radius: 9999px;
                            background-color: ${themeForColors.palette.primary[isDarkMode ? 'dark' : 'light']};
                          }
                          *::-webkit-scrollbar-thumb:hover {
                            border-width: 2px;
                          }
                          
                          ${appTheme.muiTheme.components?.MuiCssBaseline?.styleOverrides ?? ''}
                        }
                    `,
                },
            },
        }),
    );

    return responsiveFontSizes(suwayomiTheme);
};

let theme: Theme;
export const getCurrentTheme = () => theme;
export const createAndSetTheme = (...args: Parameters<typeof createTheme>) => {
    theme = createTheme(...args);
    ThemeFontLoader.load(theme).catch(defaultPromiseErrorHandler('theme::createAndSetTheme'));

    return theme;
};

export const getOptionForDirection = <T>(
    ltrOption: T,
    rtlOption: T,
    direction: Theme['direction'] = theme?.direction ?? 'ltr',
): T => (direction === 'ltr' ? ltrOption : rtlOption);

export const useGetOptionForDirection = (): typeof getOptionForDirection => {
    const muiTheme = useTheme();

    return useCallback(
        <T>(...args: Parameters<typeof getOptionForDirection<T>>) => getOptionForDirection(...args),
        [muiTheme.direction],
    );
};
