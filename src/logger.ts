const red = '\\x1b[31m';
const green = '\\x1b[32m';
const reset = '\\x1b[0m';

export const initiateLogger = () => {
  const originalLog = console.log.bind(console);
  console.log = (...args: any[]) => {
    const now = new Date();
    const time = now.toLocaleTimeString("de-DE", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    originalLog(`${green} [${time}]`, ...args,`${reset}`);
  };

  const originalError = console.error.bind(console);
  console.error = (...args: any[]) => {
    const now = new Date();
    const time = now.toLocaleTimeString("de-DE", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    originalError(`${red} [${time}]`, ...args,`${reset}`);
  };
};
