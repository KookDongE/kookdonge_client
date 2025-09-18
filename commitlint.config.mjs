export default {
  extends: ["@commitlint/config-conventional"],
  plugins: [
    {
      rules: {
        "jira-ticket-format": (parsed) => {
          const { header } = parsed;
          const pattern =
            /^\[KDE-\d+\]\s+(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert):\s+.+$/;
          const isValid = pattern.test(header);
          return [
            isValid,
            isValid
              ? ""
              : "Commit message must follow format: [KDE-123] type: description",
          ];
        },
      },
    },
  ],
  rules: {
    "jira-ticket-format": [2, "always"],
    "header-max-length": [0],
    "subject-case": [0],
    "type-enum": [0],
    "type-empty": [0],
    "subject-empty": [0],
  },
};
