const QUOTE_API = 'https://api.quotable.io/random';
const WORD_SPLIT_REGEX = /[^A-Za-z0-9\,.?'":;~!@#$%^&*()_\-=+]+/g;

/**
 * @callback NextWordCallback
 * @param {number} wordIndex
 */

class Race {

    constructor() {
        this._startTime = 0;
        this._endTime = 0;
        this.words = /** @type {string[]} */ ([]);
        this._nextWordCallbacks = /** @type {NextWordCallback[]} */ ([]);
        this._wordIndex = 0;
        this._running = false;
    }

    get running() {
        return this._running;
    }

    /**
     * @param {string} quote 
     */
    prepare(quote) {
        this.words = getWords(quote);
        this._wordIndex = 0;
    }

    _begin() {
        this._startTime = Date.now();
        this._endTime = 0;
        this._running = true;
        console.log('Begin');
    }

    _complete() {
        this._endTime = Date.now();
        this._running = false;
        console.log('Complete');
    }

    /**
     * @returns {number} Seconds
     */
    getDuration() {
        return (this._endTime - this._startTime) / 1000;
    }

    getWordsPerMinute() {
        return this.words.length / (this.getDuration() / 60);
    }

    get completed() {
        return this._endTime !== 0;
    }

    get wordNumber() {
        return this._wordIndex + 1;
    }

    get progress() {
        return this.wordNumber / this.words.length;
    }

    get currentWord() {
        return this.words[this._wordIndex];
    }

    get nextWordCallbacks() {
        return this._nextWordCallbacks;
    }

    /**
     * @param {string} textInput 
     * @returns {string}
     */
    accept(textInput) {
        if (!this._running) {
            this._begin();
        }
        const targetWord = this.words[this._wordIndex];
        const spaceIndex = textInput.indexOf(' ');
        if (spaceIndex > 0) {
            const inputWord = textInput.substring(0, spaceIndex);
            if (inputWord === targetWord) {
                this._wordIndex++;
                for (const callback of this._nextWordCallbacks) {
                    callback(this._wordIndex);
                }
                return this.accept(textInput.substring(spaceIndex + 1, textInput.length));
            }
        } else if (this._wordIndex === this.words.length - 1) {
            if (textInput === targetWord) {
                this._complete();
                return '';
            }
        }
        return textInput;
    }

};

/**
 * @returns {Promise<string>}
 */
async function getQuote() {
    const response = await fetch(QUOTE_API);
    const data = await response.json();
    return data.content;
}

/**
 * @param {string} text 
 * @returns {string[]}
 */
function getWords(text) {
    return text.split(WORD_SPLIT_REGEX);
}

async function load() {
    const textContainer = /** @type {HTMLDivElement} */ (document.getElementById('textContainer'));
    const textInput = /** @type {HTMLInputElement} */ (document.getElementById('textInput'));
    const raceProgress = /** @type {HTMLInputElement} */ (document.getElementById('raceProgress'));
    const placeholderInputText = textInput.placeholder;

    const race = new Race();

    race.nextWordCallbacks.push((wordIndex) => {
        for (let i = 0; i < wordIndex; i++) {
            const wordSpan = textContainer.children[i];
            if (textContainer.children.length > i) {
                const currentWordSpan = textContainer.children[i + 1];
                currentWordSpan.classList.add('wordCurrent');
            }
            wordSpan.classList.remove('wordCurrent');
            wordSpan.classList.add('wordDone');
        }
        textInput.placeholder = race.currentWord;
        raceProgress.value = race.progress.toString();
    });

    const reset = async () => {
        const quote = await getQuote();
        race.prepare(quote);
        
        textInput.value = '';
        textInput.placeholder = placeholderInputText;
        raceProgress.value = '0';
        while (textContainer.lastChild) {
            textContainer.lastChild.remove();
        }
        for (let i = 0; i < race.words.length; i++) {
            const wordSpan = document.createElement('span');
            wordSpan.classList.add('wordSpan');
            if (i === 0) {
                wordSpan.classList.add('wordCurrent');
            }
            wordSpan.textContent = race.words[i];
            textContainer.appendChild(wordSpan);
            textContainer.appendChild(document.createTextNode(' '));
        }
    };

    reset();

    textInput.addEventListener('input', (event) => {
        if (event instanceof InputEvent) {
            const inputText = textInput.value;
            textInput.value = race.accept(inputText);
        }
        if (race.completed) {
            const duration = race.getDuration();
            const wordsPerMinute = race.getWordsPerMinute();
            alert(`You completed the race!\nDuration: ${duration.toFixed(2)}s\nWords Per Minute: ${wordsPerMinute.toFixed(2)}`);
            reset();
        }
    });

    textInput.disabled = false;
    textContainer.classList.remove('loading');
}

load();