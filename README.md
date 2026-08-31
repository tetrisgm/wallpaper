# Wallpaper

Wallpaper is the visual half of Chiptunes, split into its own product. It runs
the original self-playing pixel-art scenes without a composer, song player,
radio, editor, or audio engine.

The initial release contains the fixed 14-scene roster and rotates scenes on a
synthetic visual clock. The clock is deliberately not an audio substitute: it
only supplies motion, energy, palette, and beat-shaped timing signals to the
existing autonomous scenes.

```sh
npm install
npm test
npm start
```

Use the bottom controls to choose a scene or presentation. In the desktop app,
the window is attached at wallpaper level on macOS.
