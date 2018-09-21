import {createInterface} from 'readline';
import {createReadStream} from 'fs';

class LogParser {
    constructor(fileName) {
        if (!fileName) {
            throw new Error('A file path must be passed in as an argument; e.g., \'npm run start sample.log\'.');
        }

        this.logsIndexedByDayAndUrl = { };

        const readInterface = createInterface({
            input: createReadStream(fileName)
        });

        // Use bind() to keep scope focused on class, not the interface.
        readInterface.on('line', this._processLine.bind(this));

        readInterface.on('close', () => this.printReport());
    }

    /**
     * Handles incoming lines from the input stream.
     * @param {String} line A single line.
     * @return {void}
     */
    _processLine(line) {
        const [seconds, url] = line.split('|');

        this._index(new Date(seconds * 1000), url);
    }

    /**
     * Indexes a log by date and URL.
     * @param {Date} logDate The date of the log.
     * @param {*} url The URL.
     * @return {void}
     */
    _index(logDate, url) {
        const month = this._formatWithLeading0(logDate.getUTCMonth() + 1); // Months are 0-indexed.
        const day = this._formatWithLeading0(logDate.getUTCDate());
        const dateString = `${month}/${day}/${logDate.getUTCFullYear()} GMT`;

        // Initialize subdictionary if it's not already present.
        if (!this.logsIndexedByDayAndUrl[dateString]) {
            this.logsIndexedByDayAndUrl[dateString] = { };
        }

        if (!this.logsIndexedByDayAndUrl[dateString][url]) {
            this.logsIndexedByDayAndUrl[dateString][url] = 1;
        }
        else {
            this.logsIndexedByDayAndUrl[dateString][url]++;
        }
    }

    /**
     * 
     * @param {Number} value A number.
     * @return {String} A string equivalent left-padded by 0s.
     */
    _formatWithLeading0(value) {
        return String(value).padStart(2, '0');
    }

    /**
     * Compares two URL/hit count pairs.
     * @param {Array} pair1 A pair of values.
     * @param {String} pair1[0] A URL.
     * @param {Number} pair1[1] The number of times the URL was hit.
     * @param {Array} pair2 A pair of values.
     * @param {String} pair2[0] A URL.
     * @param {Number} pair2[1] The number of times the URL was hit.
     * @return {Number} A positive number if b's count is greater than a.
     */
    _descendingCount([aUrl, aCount], [bUrl, bCount]) {
        return bCount - aCount;
    }

    /**
     * Outputs a URL and its hit count.
     * @param {Array} pair A pair of values.
     * @param {String} pair[0] A URL.
     * @param {Number} pair[1] The number of times the URL was hit.
     * @return {void}
     */
    _printUrlAndCount([url, count]) {
        console.log(`${url} ${count}`);
    }

    /**
     * Prints a report of URL visits (descending) grouped by day (ascending).
     * @return {void}
     */
    printReport() {
        const sortedDays = Object.keys(this.logsIndexedByDayAndUrl).sort();
        for (let k = 0; k < sortedDays.length; k++) {
            this.printReportForDate(sortedDays[k]);
        }
    }

    /**
     * Prints a report of URL visits (descending) for a single day.
     * @param {String} dateString A date string.
     * @return {void}
     */
    printReportForDate(dateString) {
        console.log(dateString);

        const urlsAndCounts = this.logsIndexedByDayAndUrl[dateString];
        const sortedUrlsAndCounts = Object.entries(urlsAndCounts || {}).sort(this._descendingCount);
        sortedUrlsAndCounts.forEach(this._printUrlAndCount);
    }
}

try {
    new LogParser(process.argv[2]);
}
catch (ex) {
    console.error(ex.toString());
}
