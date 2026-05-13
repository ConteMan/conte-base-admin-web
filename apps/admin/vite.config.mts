import { defineConfig } from '@vben/vite-config';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import { loadEnv, type PluginOption } from 'vite';

type AdminEnv = Record<string, string | undefined>;

function getBuildVersion(env: AdminEnv) {
  return (
    env.VITE_APP_BUILD_VERSION ||
    process.env.VITE_APP_BUILD_VERSION ||
    env.VITE_SENTRY_RELEASE ||
    process.env.VITE_SENTRY_RELEASE ||
    env.VITE_APP_VERSION ||
    process.env.VITE_APP_VERSION ||
    process.env.npm_package_version ||
    'admin-local'
  );
}

function createVersionManifestPlugin(env: AdminEnv, mode: string): PluginOption {
  return {
    apply: 'build',
    generateBundle() {
      const buildVersion = getBuildVersion(env);
      const commit =
        env.VITE_GIT_COMMIT ||
        process.env.VITE_GIT_COMMIT ||
        process.env.GIT_COMMIT ||
        process.env.COMMIT_HASH ||
        '';

      this.emitFile({
        fileName: 'version.json',
        source: `${JSON.stringify(
          {
            appVersion:
              env.VITE_APP_VERSION ||
              process.env.VITE_APP_VERSION ||
              process.env.npm_package_version ||
              '1.0.0',
            buildTime: new Date().toISOString(),
            buildVersion,
            commit,
            env: env.VITE_APP_ENV || process.env.VITE_APP_ENV || mode,
          },
          null,
          2,
        )}\n`,
        type: 'asset',
      });
    },
    name: 'conte-base:version-manifest',
  };
}

function createSentryPlugin(env: AdminEnv) {
  const authToken = process.env.SENTRY_AUTH_TOKEN;
  const org = process.env.SENTRY_ORG;
  const project = env.VITE_SENTRY_PROJECT || process.env.VITE_SENTRY_PROJECT;

  if (!authToken || !org || !project) {
    return null;
  }

  return sentryVitePlugin({
    authToken,
    org,
    project,
    release: {
      name: getBuildVersion(env),
    },
    sourcemaps: {
      assets: './dist/**',
    },
    url: env.VITE_SENTRY_URL || process.env.VITE_SENTRY_URL,
  });
}

function getAdminEnv(mode: string) {
  return loadEnv(mode, process.cwd(), '') as AdminEnv;
}

function getDevPort(env: AdminEnv) {
  const rawPort = env.VITE_DEV_PORT || process.env.VITE_DEV_PORT || '5175';
  const port = Number.parseInt(rawPort, 10);
  if (!Number.isInteger(port) || port <= 0 || port > 65_535) {
    throw new Error(`invalid VITE_DEV_PORT: ${rawPort}`);
  }
  return port;
}

// any 类型兜底
const config: any = defineConfig(async (configEnv): Promise<any> => {
  const mode = configEnv?.mode ?? 'development';
  const env = getAdminEnv(mode);
  const sentryPlugin = createSentryPlugin(env);
  const plugins = [createVersionManifestPlugin(env, mode)];
  if (sentryPlugin) {
    plugins.push(sentryPlugin);
  }
  const adminApiProxyTarget =
    env.VITE_ADMIN_API_PROXY_TARGET ||
    process.env.VITE_ADMIN_API_PROXY_TARGET ||
    'http://localhost:8080';
  return {
    application: {},
    vite: {
      build: {
        sourcemap: true,
      },
      plugins,
      server: {
        port: getDevPort(env),
        strictPort: true,
        proxy: {
          '/api': {
            changeOrigin: true,
            // 将 /api/* 代理到本地后端 /api/v1/admin/*
            rewrite: (path: string) => path.replace(/^\/api/, '/api/v1/admin'),
            target: adminApiProxyTarget,
            ws: true,
          },
        },
      },
    },
  };
});

export default config;
