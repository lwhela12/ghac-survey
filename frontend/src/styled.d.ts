import 'styled-components';

declare module 'styled-components' {
  export interface DefaultTheme {
    colors: {
      primary: string;
      secondary: string;
      accent: {
        coral: string;
        purple: string;
        teal: string;
        yellow: string;
        pink: string;
      };
      background: string;
      surface: string;
      surfaceAlt: string;
      text: {
        primary: string;
        secondary: string;
        light: string;
        inverse: string;
      };
      border: string;
      borderLight: string;
      error: string;
      success: string;
      warning: string;
      chatBubble: {
        bot: string;
        botText: string;
        user: string;
        userText: string;
      };
      gradients: {
        primary: string;
        secondary: string;
        artistic: string;
        sunset: string;
        ocean: string;
      };
    };
    fonts: {
      primary: string;
      display: string;
    };
    fontSizes: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      '2xl': string;
      '3xl': string;
      '4xl': string;
      '5xl': string;
    };
    fontWeights: {
      light: number;
      regular: number;
      medium: number;
      semibold: number;
      bold: number;
    };
    spacing: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      '2xl': string;
      '3xl': string;
      '4xl': string;
    };
    borderRadius: {
      sm: string;
      md: string;
      lg: string;
      xl: string;
      '2xl': string;
      full: string;
    };
    breakpoints: {
      mobile: string;
      tablet: string;
      desktop: string;
      wide: string;
    };
    transitions: {
      fast: string;
      normal: string;
      slow: string;
    };
    shadows: {
      sm: string;
      md: string;
      lg: string;
      xl: string;
      inner: string;
      artistic: string;
    };
    animations: {
      bounce: string;
      pulse: string;
      float: string;
    };
  }
}