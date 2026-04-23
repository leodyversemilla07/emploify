module.exports = {
  rootDir: ".",
  testEnvironment: "node",
  testMatch: ["<rootDir>/src/**/*.spec.ts"],
  moduleFileExtensions: ["ts", "js", "json"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: {
          target: "ES2023",
          module: "commonjs",
          moduleResolution: "node",
          esModuleInterop: true,
          emitDecoratorMetadata: true,
          experimentalDecorators: true,
          skipLibCheck: true,
          strict: false,
          types: ["jest", "node"],
        },
      },
    ],
  },
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
}
