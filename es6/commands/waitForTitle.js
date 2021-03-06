import events from 'events';

/**
 * This custom command allows us to wait until the value of the page title matches the provided expression
 * (aka. the 'checker' function).
 * It retries executing the checker function every 100ms until either it evaluates to true or it reaches
 * maxTimeInMilliseconds (which fails the test).
 * Nightwatch uses the Node.js EventEmitter pattern to handle asynchronous code so this command is also an EventEmitter.
 *
 * h3 Examples:
 *
 *     browser.waitForTitle(function(title) {
 *         return title === "something";
 *     });
 *
 * @author dkoo761
 * @see https://github.com/beatfactor/nightwatch/issues/246#issuecomment-59461345
 * @param {Function} checker - function that must return true if the title matches your requisite, false otherwise
 * @param {Integer} [timeoutInMilliseconds] - timeout of this wait commands in milliseconds
 * @param {String} [defaultMessage] - message to display
*/

class WaitForTitle extends events.EventEmitter {
	constructor() {
		super();

		this.timeoutRetryInMilliseconds = 100;
		this.defaultTimeoutInMilliseconds = 5000;
		this.startTimeInMilliseconds = null;
	}

	command(checker, timeoutInMilliseconds, defaultMessage) {
		this.startTimeInMilliseconds = new Date().getTime();

		if (typeof timeoutInMilliseconds !== 'number') {
			timeoutInMilliseconds = this.api.globals.waitForConditionTimeout;
		}
		if (typeof timeoutInMilliseconds !== 'number') {
			timeoutInMilliseconds = this.defaultTimeoutInMilliseconds;
		}
		if (defaultMessage && typeof defaultMessage !== 'string') {
			this.emit('error', "defaultMessage is not a string");
			return;
		}

		this.check(checker, (result, loadedTimeInMilliseconds) => {
			let message = "";
			if (defaultMessage) {
				message = defaultMessage;
			} else if (result) {
				message = `waitForTitle: Expression was true after ${loadedTimeInMilliseconds - this.startTimeInMilliseconds}.`;
			} else {
				message = `waitForTitle: ${element}@${attribute}. Expression wasn't true in ${timeoutInMilliseconds} ms.`;
			}
			
			this.client.assertion(result, 'expression false', 'expression true', message, true);
			return this.emit('complete');
		}, timeoutInMilliseconds);

		return this;
	}

	check(checker, callback, maxTimeInMilliseconds) {
		return this.api.getTitle(title => {
			let now = new Date().getTime();
			if (checker(title)) {
				return callback(true, now);
			} else if (now - this.startTimeInMilliseconds < maxTimeInMilliseconds) {
				return setTimeout(() => {
					return this.check(checker, callback, maxTimeInMilliseconds);
				}, this.timeoutRetryInMilliseconds);
			} else {
				return callback(false);
			}
		});
	}
}

export default WaitForTitle;
