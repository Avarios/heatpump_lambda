const red = '\\x1b[31m';
const green = '\\x1b[32m';
const reset = '\\x1b[0m';

let verboseLogging = false;
//TODO: Logleve definitions error, info, verbose -> Also change in every log call
//TODO: Log into file 

export const initiateLogger = (verbose: boolean = false) => {
  verboseLogging = verbose;
  
  const originalLog = console.log.bind(console);
  console.log = (...args: any[]) => {
    if (!verboseLogging) return;
    
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
