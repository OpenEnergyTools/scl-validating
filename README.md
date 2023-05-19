# \<oscd-publisher>

## What is this?

This is an editor plugin for [open-scd-core](https://github.com/openscd/open-scd-core#readme), the new core editor engine for OpenSCD. On the long term this plugin will allow you to manage validation algorithms for SCL and see all issues found by the algorithms in a central place. For now only the schema validator using [libxml2](https://github.com/openscd/xmlvalidate.js) is going to be part of the distribution.

## Linting and formatting

To scan the project for linting and formatting errors, run

```bash
npm run lint
```

To automatically fix linting and formatting errors, run

```bash
npm run format
```

## Testing with Web Test Runner

To execute a single test run:

```bash
npm run test
```

To run the tests in interactive watch mode run:

```bash
npm run test:watch
```

## Tooling configs

For most of the tools, the configuration is in the `package.json` to reduce the amount of files in your project.

If you customize the configuration a lot, you can consider moving them to individual files.

## Local Demo with `web-dev-server`

```bash
npm start
```

To run a local development server that serves the basic demo located in `demo/index.html`

&copy; Jakob Vogelsang
