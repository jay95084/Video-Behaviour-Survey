import { Component, Host, h, State, Prop } from '@stencil/core';
import Timer from 'timer.js';
import playIcon from './play.svg';
import pauseIcon from './pause.svg';

@Component({
  tag: 'video-behaviour-survey',
  styleUrl: 'video-behaviour-survey.css',
  shadow: true,
})
export class VideoBehaviourSurvey {
  @Prop() timeout: any = 5;
  @Prop() challengeInterval: any = 5;
  @Prop() challengeAnswerTime: any = 5;
  @Prop() videoId: any;
  @Prop() bootupTime: any;
  @Prop() start: any;
  @Prop() end: any;
  @Prop() videoWidth: any;
  @Prop() videoHeight: any;
  @Prop() exitSleepModeKey: string;
  @Prop() sleepModeText: string;
  @Prop() bootupText: string;
  @Prop() timeOverText: string;
  @Prop() challengeSuccessText: string;
  @Prop() challengeFailText: string;
  @Prop() challengeDescriptionText: string;

  player: any;
  initedVideo: boolean = false;
  elementReference: any;
  fadeoutElementReference: any;
  events: any = [];
  @State() renderTrigger: boolean = false;
  @State() idleTimer: number = this.timeout;
  @State() challengeTimer: number = this.challengeInterval;
  @State() challengeAnswerTimer: number = this.challengeAnswerTime;
  @State() showFadeOut: boolean = false;


  timer: any;
  challengeTickTimer: any;
  challengeAnswerTickTimer: any;
  @State() lastPressedKey: any;
  @State() showKeyPressEvents: boolean = true;
  @State() isChallengeInProgress: boolean = false;
  @State() challengeKey: string = '';
  keyChallenges: any = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
  wasLastChallengeSuccessful: boolean = null;
  timeupdater: any;
  @State() isChallengeActive: boolean = true;
  @State() bootUpInProgress: boolean = false;
  timeSpentOnSleepMode: number = 1;
  timeSpentInterval: any = null;
  timeRecordResult: string = ``;
  timeRecordInputElement: any;
  challengeRecordResult: string = ``;
  challengeRecordInputElement: any;

  componentWillLoad() {
    const inputs = document.querySelectorAll('input');
    if(inputs.length) {
      this.timeRecordInputElement = inputs[0];
      this.challengeRecordInputElement = inputs[1];
      this.timeRecordInputElement.style.display = 'none';
      this.challengeRecordInputElement.style.display = 'none';
    }
    window['IsComponentReady'] = true;
  }

  componentDidLoad() {
    console.log('Video Id', this.videoId);
    window.addEventListener('keydown', (event) => {
      const keyName = event.key;

      if (keyName === 'Control') {
        // do not alert when only Control key is pressed.
        return;
      }

      if (event.ctrlKey) {
        // Even though event.key is not 'Control' (e.g., 'a' is pressed),
        // event.ctrlKey may be true if Ctrl key is pressed at the same time.
        console.log(`Combination of ctrlKey + ${keyName}`);
      } else {
        console.log(`Key pressed ${keyName}`);
        this.events.push({ type: 'keypress', detail: keyName, timestamp: Date.now() });
        if (this.isChallengeInProgress) {
          if (keyName.toLowerCase() === this.challengeKey) {
            this.wasLastChallengeSuccessful = true;
            this.challengeRecordResult += `${this.challengeRecordResult}, success`;
            this.events.push({ type: 'challenge', detail: `complete - SUCCESS`, timestamp: Date.now() });
            this.challengeAnswerTickTimer.stop(this.challengeAnswerTime);
            this.isChallengeInProgress = false;
            this.challengeKey = null;
            this.challengeTickTimer.start(this.challengeInterval);
          }
        }
        if (keyName.toLowerCase() === this.exitSleepModeKey.toLowerCase()) {
          this.events.push({ type: 'keypress', detail: `${keyName}`, timestamp: Date.now() });
          this.renderTrigger = !this.renderTrigger;

          if (this.showFadeOut) {
            this.events.push({ type: 'info', detail: `Exiting sleep mode`, timestamp: Date.now() });
            this.bootUpInProgress = true;
            clearInterval(this.timeSpentInterval);
            this.timeRecordResult += `${this.timeSpentOnSleepMode},`;
            this.timeSpentOnSleepMode = 1;
            setTimeout(() => {
              this.bootUpInProgress = false;
              this.showFadeOut = false;
              this.player.playVideo();
            }, this.bootupTime * 1000);
          }
        }
      }

      this.lastPressedKey = keyName;
    }, false);

    this.timer = new Timer({
      tick: 1,
      ontick: (sec) => {
        this.events.push({ type: 'timeout', detail: `${Math.round(sec / 1000)}`, timestamp: Date.now() });
        this.renderTrigger = !this.renderTrigger;
        this.fadeoutElementReference.click();
        this.idleTimer = sec;
      },
      onstart: () => {
        this.events.push({ type: 'timeout', detail: `Countdown started`, timestamp: Date.now() });
        this.renderTrigger = !this.renderTrigger;
      },
      onend: () => {
        this.events.push({ type: 'timeout', detail: `Countdown ended`, timestamp: Date.now() });
        this.events.push({ type: 'info', detail: `Entering sleep mode`, timestamp: Date.now() });
        this.renderTrigger = !this.renderTrigger;
        this.showFadeOut = true;
        this.timeSpentInterval = setInterval(() => {
          this.timeSpentOnSleepMode++;
        }, 1000);
        this.challengeAnswerTickTimer.stop();
        this.challengeTickTimer.stop();
        this.idleTimer = this.timeout;
      },
      onstop: () => {
        this.events.push({ type: 'timeout', detail: `Timeout tick stopped`, timestamp: Date.now() });
        this.renderTrigger = !this.renderTrigger;
        this.idleTimer = this.timeout;
      },
    });

    this.challengeTickTimer = new Timer({
      tick: 1,
      ontick: (sec) => {
        this.events.push({ type: 'challenge', detail: `${Math.round(sec / 1000)}`, timestamp: Date.now() });
        this.renderTrigger = !this.renderTrigger;
        this.challengeTimer = sec;
      },
      onstart: () => {
        this.events.push({ type: 'challenge', detail: `Countdown started`, timestamp: Date.now() });
        this.renderTrigger = !this.renderTrigger;
      },
      onend: () => {
        this.events.push({ type: 'challenge', detail: `Countdown ended`, timestamp: Date.now() });
        this.challengeKey = this.generateRandomKey();
        this.isChallengeInProgress = true;
        this.challengeAnswerTickTimer.start(this.challengeAnswerTime);
        this.renderTrigger = !this.renderTrigger;
        this.challengeTimer = this.timeout;
      },
      onstop: () => {
        this.events.push({ type: 'challenge', detail: `Timeout tick stopped`, timestamp: Date.now() });
        this.renderTrigger = !this.renderTrigger;
        this.challengeTimer = this.timeout;
        this.isChallengeInProgress = false;
        this.challengeKey = null;
      },
    });

    this.challengeAnswerTickTimer = new Timer({
      tick: 1,
      ontick: (sec) => {
        this.events.push({ type: 'challenge answer', detail: `${Math.round(sec / 1000)}`, timestamp: Date.now() });
        this.renderTrigger = !this.renderTrigger;
        this.challengeAnswerTimer = sec;
      },
      onstart: () => {
        this.events.push({ type: 'challenge answer', detail: `Countdown started`, timestamp: Date.now() });
        this.renderTrigger = !this.renderTrigger;
      },
      onend: () => {
        this.events.push({ type: 'challenge answer', detail: `Countdown ended`, timestamp: Date.now() });
        this.events.push({ type: 'challenge', detail: `timeout - FAILED`, timestamp: Date.now() });
        this.wasLastChallengeSuccessful = false;
        this.challengeRecordResult += `${this.challengeRecordResult}, fail`;
        this.isChallengeInProgress = false;
        this.challengeKey = null;
        this.challengeTickTimer.start(Number(this.challengeInterval));
        this.renderTrigger = !this.renderTrigger;
        this.challengeAnswerTimer = this.timeout;
      },
      onstop: () => {
        this.events.push({ type: 'challenge answer', detail: `Timeout tick stopped`, timestamp: Date.now() });
        this.renderTrigger = !this.renderTrigger;
        this.challengeAnswerTimer = this.timeout;
        this.isChallengeInProgress = false;
        this.challengeKey = null;
      },
    });

    window['onYouTubeIframeAPIReady'] = this.onYouTubeIframeAPIReady.bind(this);
    var tag = document.createElement('script');

    tag.src = 'https://www.youtube.com/iframe_api';
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  }


  generateRandomKey() {
    return this.keyChallenges[Math.floor(Math.random() * this.keyChallenges.length)];
  }

  onYouTubeIframeAPIReady() {
    this.player = new YT.Player(this.elementReference, {
      height: this.videoHeight,
      width: this.videoWidth,
      videoId: this.videoId,
      events: {
        'onReady': this.onPlayerReady.bind(this),
        'onStateChange': this.onPlayerStateChange.bind(this),
      },
      playerVars: {
        controls: 0,
        autohide: 0,
        modestbranding: 1,
        iv_load_policy: 3,
        disablekb: 1,
        start: 0,
        rel: 0,
      },
    });
  }

  onPlayerReady(_event) {
    const nextButton: HTMLElement = document.querySelector('#NextButton');
    if (nextButton) {
      nextButton.style.display = 'none';
    }
    this.events.push({ type: 'info', detail: 'Player is ready', timestamp: Date.now() });
    this.renderTrigger = !this.renderTrigger;
    const updateTime = () => {
      if (this.player && this.player.getCurrentTime) {
        const videotime = this.player.getCurrentTime();
        if (this.end <= videotime && this.isChallengeActive) {
          this.endChallenge();
        }
      }
    };
    this.timeupdater = setInterval(updateTime, 1000);
    // event.target.playVideo();
  }

  endChallenge() {
    const nextButton: HTMLElement = document.querySelector('#NextButton');
    this.timeRecordInputElement.value = this.timeRecordResult;
    this.challengeRecordInputElement.value = this.challengeRecordResult;
    if (nextButton) {
      nextButton.style.display = 'inline-block';
    }
    this.isChallengeActive = false;
    this.player.stopVideo();
  }

  onPlayerStateChange(event) {
    /*    -1 (unstarted)
        0 (ended)
        1 (playing)
        2 (paused)
        3 (buffering)
        5 (video cued).*/
    switch (event.data) {
      case YT.PlayerState.ENDED:
        this.events.push({ type: 'player', detail: 'Video ended', timestamp: Date.now() });
        this.renderTrigger = !this.renderTrigger;
        break;
      case YT.PlayerState.PLAYING:
        this.timer.stop();
        this.events.push({ type: 'player', detail: 'Video state is playing now', timestamp: Date.now() });
        this.renderTrigger = !this.renderTrigger;
        if (!this.isChallengeInProgress) {
          this.challengeTickTimer.start(Number(this.challengeInterval));
        }
        break;
      case YT.PlayerState.PAUSED:
        this.events.push({ type: 'player', detail: 'Video state is pause now', timestamp: Date.now() });
        this.renderTrigger = !this.renderTrigger;
        this.timer.start(Number(this.timeout));
        this.challengeTickTimer.stop();
        this.challengeAnswerTickTimer.stop();
        break;
      case YT.PlayerState.BUFFERING:
        this.events.push({ type: 'player', detail: 'Video player state is buffering now', timestamp: Date.now() });
        this.renderTrigger = !this.renderTrigger;
        break;
      case YT.PlayerState.CUED:
        this.events.push({ type: 'player', detail: 'Video player state is cued now', timestamp: Date.now() });
        this.renderTrigger = !this.renderTrigger;
        break;
      default:
        console.log('other event', event);
        break;
    }
  }

  stopVideo() {
    this.player.stopVideo();
  }

  render() {
    console.clear();
    return (
      <Host>
        <div id="player-youtube" ref={(el) => this.elementReference = el}/>

        <div ref={(el) => this.fadeoutElementReference = el} class="fadeout-element"
             style={{ display: this.showFadeOut ? 'flex' : 'none' }}>

          This is a simulation of sleep mode
          <br/>
          <i>{this.bootUpInProgress ? this.bootupText : this.sleepModeText}</i>
        </div>

        <div>
          <div class="video-controls" style={{ width: `${this.videoWidth}px` }}>

            <div id="player">

              <div id="player-content">

                {this.isChallengeActive
                  ? <div id="player-controls">
                    <div class="control">
                      <div class="button" onClick={() => {
                        if (!this.initedVideo) {
                          this.initedVideo = true;
                          this.player.seekTo(this.start);
                        } else {
                          this.player.playVideo();
                        }
                      }}>
                        <img src={playIcon} alt=""/>
                      </div>
                      <div class="button" onClick={() => this.player.pauseVideo()}>
                        <img src={pauseIcon} alt=""/>
                      </div>
                    </div>
                    <div class={`action-keypress ${this.isChallengeInProgress ? 'attention-title' : ''}`}>
                      {this.isChallengeInProgress ? `Please press "${this.challengeKey.toUpperCase()}" on your keyboard` : this.challengeDescriptionText}
                      {(this.isChallengeInProgress && this.wasLastChallengeSuccessful !== null) &&
                      <div class={`${this.wasLastChallengeSuccessful ? 'success' : 'fail'}`}>
                        {this.wasLastChallengeSuccessful
                          ? this.challengeSuccessText
                          : this.challengeFailText}
                      </div>}

                    </div>
                  </div> : <div id="player-controls">
                    <div class="control" style={{ opacity: '0.3' }}>
                      <div class="button">
                        <img src={playIcon} alt=""/>
                      </div>
                      <div class="button">
                        <img src={pauseIcon} alt=""/>
                      </div>
                    </div>
                    <div class={`action-keypress`}>
                      {this.timeOverText}
                    </div>
                  </div>}

              </div>
            </div>

          </div>
          {console.table && console.table(this.events)}
        </div>
      </Host>
    );
  }

}
