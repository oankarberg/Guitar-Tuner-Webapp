'use strict';

/**
 * @ngdoc function
 * @name guitarTunerAppApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the guitarTunerAppApp
 */
angular.module('guitarTunerAppApp')
  .controller('MainCtrl', function ($scope, $timeout, $window) {
   

  $scope.noteFreq = 0;
  $scope.$watch('noteFreq', function(){  });
  var numTicks = 7;
  var tickSeparation = 30;
  var initTickHeight = 150;
  var correctTickHeight = 160;
  var correctOffset = correctTickHeight - initTickHeight;
  var tickDeltaY = 17;

  $scope.timer = "Pausad"


  $scope.initializeTuner = function(){
    var $tunerViewContainer = $("#tunerView");
    var $div = $("<div>", {id: "tick_0"});
    $div.attr('style',  'height:' + (correctTickHeight) + 'px; ' );
    $tunerViewContainer.append($div);
    for (var i = 1; i <= numTicks; i++) {
      var $div = $("<div>", {id: "tick_"+i});
      $div.attr('style','-webkit-transform: translate(' + (tickSeparation * i )+ 'px,' + (correctOffset + i*tickDeltaY/2)+  'px);  ' +
                          'transform: translate(' + (tickSeparation * i) + 'px,' + (correctOffset + i*tickDeltaY/2) +  'px); '  + 
                          'height:' + (initTickHeight - correctOffset - tickDeltaY*i) + 'px; ' );
      $tunerViewContainer.append($div);
      var $div = $("<div>", {id: "tick_"+(-1)*i});
       $div.attr('style','-webkit-transform: translate(' + (tickSeparation * i *(-1)) + 'px,' + (correctOffset + i*tickDeltaY/2) +  'px);  ' +
                          'transform: translate(' + (tickSeparation * i * (-1))+ 'px,' + (correctOffset + i*tickDeltaY/2) +  'px); ' + 
                          'height:' + (initTickHeight -  correctOffset - tickDeltaY*i) + 'px;');
      $tunerViewContainer.append($div);
    };
  }

  var timerInterval;

  function play()
  {
    var div = document.getElementById("playPause");
    div.className = "pause";
    startAudio();
    startClock();
    $scope.playing = true;
  }


  function pause()
  {
    var div = document.getElementById("playPause");
    div.className = "play";
    stopAudio();
    $scope.playing = false;
    $scope.timer = "Pausad"
    clearInterval(timerInterval);
  }
  $scope.initAudioOk = function ()
  {
    $scope.initAudio()
  }


  $scope.playPause = function ()
  {
    if($scope.playing == true)
    {
      pause();
    }
    else
    {
      play();
    }
  }

  function startClock()
  {
    var timeoutLengthSeconds = 5*60;
    var start = new Date;
    $scope.updateClock(timeoutLengthSeconds);
      timerInterval = setInterval(function() {
          var secondsPassed = (new Date - start)/1000;
          if(secondsPassed < timeoutLengthSeconds)
          {
            $scope.updateClock(timeoutLengthSeconds-secondsPassed);
          }
          else
          {
            pause();
          }
      }, 1000);
  }

  $scope.updateClock = function(timeoutLengthSeconds)
  {
    function formatNumberLength(num, length) {
        var r = "" + num;
        while (r.length < length) {
            r = "0" + r;
        }
        return r;
    }
    var minutes = Math.floor(timeoutLengthSeconds / 60);
    var seconds = Math.floor(timeoutLengthSeconds%60);
    //Kallar onTimeout för att $scope.timer ska uppdateras i DOM
    $scope.onTimeout = function(){
        mytimeout = $timeout($scope.onTimeout,100);
        $scope.timer = formatNumberLength(minutes,2)+":"+formatNumberLength(seconds,2);
    }
    var mytimeout = $timeout($scope.onTimeout,100);
    
    // var clock = document.getElementById("#message").text("Timeout: "+formatNumberLength(minutes,2)+":"+formatNumberLength(seconds,2));
  }

  function updateTuner(noteIndex, noteError, noteFrequency) 
  {
    //TODO: Assert params
    if(!(noteIndex && noteError) || !(noteIndex > 0 && noteIndex <12) || !(noteError > -50 && noteError < 50))
      return;

    var sharpHtml = '<sup class="sharp">#</sup>';
    var notes = ['C','C'+sharpHtml,'D','D'+sharpHtml,'E','F','F'+sharpHtml,'G','G'+sharpHtml,'A','A'+sharpHtml,'B'];
    
    $scope.noteFreq = Math.round(noteFrequency);
    //scale between -1 and 1
    var noteErrorScaled = noteError * 2.0;
    //Reset highlighted tick
    for(var i = 0; i < 8; i++){

        document.getElementById('tick_' + i).className = "";
        document.getElementById("tick_"+(-1)*i).className = "";

    }

    document.getElementById('tuneArrowLeft').className = "";
    document.getElementById('tuneArrowRight').className = "";

    var noteView = document.getElementById("noteView");
    noteView.innerHTML = notes[noteIndex];
    
    //TUNED!
    if (Math.abs(noteErrorScaled) < (1.0 / numTicks )){
      var tick = document.getElementById("tick_0");
      tick.className = "tick_0Highlighted";
      //Sätt bokstaven till grön
      document.getElementById("noteView").className = "noteCleanHighlighted";

      document.getElementById('tuneArrowLeft').className = "tuneArrowLeft_ok";
      document.getElementById('tuneArrowRight').className = "tuneArrowRight_ok";
    }
    else{
      var tick = document.getElementById("tick_0");
      tick.className = "tick_0_normal";

      document.getElementById("noteView").className = "noteWrongHighlighted";

      //Set highlighted tick 
      var tickToHighlight = document.getElementById('tick_' + Math.round(noteErrorScaled * numTicks));
      tickToHighlight.className = "tickHighlighted";

      //På vänstra sidan
      if(noteError < 0)
        document.getElementById('tuneArrowLeft').className = "tuneArrowLeft_wrong";
      else
        document.getElementById('tuneArrowRight').className = "tuneArrowRight_wrong";
    }
    
  }

  var audioContext = new AudioContext();
  var inputStreamNode = null,
      gainNode = null;

  function getMaxPeak(inputVector,numFreq)
  {
      numFreq = typeof numFreq !== 'undefined' ? numFreq : 2000;

      var vec1 = inputVector;
      var vec2 = [], vec3 = [], vec4 = [], vec5 = [];
  

      for(var i = 0; i < numFreq; i++)
      {
        if(i%2 === 0)
          vec2.push(inputVector[i]);      
        if(i%3 === 0)
          vec3.push(inputVector[i]);
        if(i%4 === 0)
          vec4.push(inputVector[i]);
        if(i%5 === 0)
          vec5.push(inputVector[i]);
      }

      var zeroArray = [];
      var length = 0;
      //Temp solution. want to add exact zeros
      while(length < 2000)
      {
        zeroArray.push(0);
        length++;
      }
      vec2.concat(zeroArray);
      vec3.concat(zeroArray);
      vec4.concat(zeroArray);
      vec5.concat(zeroArray);

      var sumVec = [];
      for(var i = 0; i < numFreq; i++)
          sumVec[i] = vec1[i] + vec2[i] +  vec3[i] + vec4[i] + vec5[i];
      

      var peakMax = 0;
      var peakMaxInd = 0;
      var size = inputVector.length * 2;
      var whichStaple = 0;
      $scope.vecAverageAmp = [];
      var sum = 0;

      for(var i=7;i<numFreq;i++)
      {
          // console.log('inputVector ' , inputVector[i]);
          // var amplitude = inputVector[i];
          var amplitude = sumVec[i];
    
          if(amplitude>peakMax)
          {
              peakMax=amplitude;
              peakMaxInd=i;
          }

      }

      return {"peakInd":peakMaxInd,"peakAmp":peakMax};
  }

  //MAIN

  var scriptProcessorNode;
  var audioWindowSize = 65536;
  var audioWindow = new Float32Array(audioWindowSize);
  var audioWindowProcessed = new Float32Array(audioWindowSize);
  var hammingWindowFilter = new Float32Array(audioWindowSize);
  var sampleRate;
  for (var i = 0; i < hammingWindowFilter.length; i++) {
      hammingWindowFilter[i] = 0.54 - 0.46 * Math.cos(2*Math.PI * i/(hammingWindowFilter.length-1));
  };
  var fft;

  function applyHamming(inputVector, outputVector)
  {
      for (var i = 0; i < inputVector.length; i++) {
          outputVector[i] = inputVector[i] * hammingWindowFilter[i];
      };
  }

  function log2(val) 
  {
    return Math.log(val) / Math.LN2;
  }

  function getNoteInfo(frequency)
  {
      var note = (Math.round(57+log2( frequency/440.0 )*12 ))%12;
      var note2 = Math.round(57+log2( frequency/440.0 )*12 );
      // console.log(note);
      var noteFull = Math.round(log2( frequency/440.0 )*12); //runda ner till semiton
      var noteFreq = Math.pow(2,noteFull/12.0)*440.0; //ta fram notfreq från rundad semiton - nära grundfreq
     
      var errorMin = frequency - noteFreq;
      
      var noteOther = (errorMin > 0) ? noteFull+1 : noteFull-1;
     
      var freqOther = Math.pow(2,noteOther/12.0)*440.0;
      
      var cent = errorMin / Math.abs(noteFreq - freqOther);
      // console.log('note' ,note , 'cent ' ,cent , 'frekvens ', frequency);
      
      var noteInfo = {
          "noteIndex": note,
          "noteError": cent,
          "noteFreq": frequency
      };

      return noteInfo;
  }
  // Create a stream of the audio input 
  function gotStream(stream) {

      document.getElementById('playPause').style.display = 'block'

      var bufferSize = 2048; // Måste va power of 2, 
      gainNode = audioContext.createGain(); //Skapar GainNode objekt som kan kontrollera volymen
      gainNode.gain.value = 1000.0;
      
      inputStreamNode = audioContext.createMediaStreamSource(stream); //Skapar ett MediaStreamAudioSourceNode objekt som strömmar in ljud från mikrofonen.
      inputStreamNode.connect(gainNode); //Kopplar ihop med ljudkontrollen

      scriptProcessorNode = audioContext.createScriptProcessor(bufferSize, 1, 1); //För ljudanalys, en inkanal och en utkanal
      

      sampleRate = audioContext.sampleRate; //Hämta sample per sekund från audio input, används för alla objekt/noder 
      fft = new FFT(audioWindowSize, sampleRate); //Skapar fouriertransform. Hitta en balans mellan windowsize och samplerate (65536 standard?)

      gainNode.connect (scriptProcessorNode); //koppla ihop volym och ljudobjekt 

      // zeroPadding/zeroGain öka  vektorn för att få bättre upplösning i frekvensen. nogrannare. Effektivare
      var zeroGain = audioContext.createGain();
      zeroGain.gain.value = 0.0;
      scriptProcessorNode.connect( zeroGain );
      zeroGain.connect( audioContext.destination ); 

      play();
  }

  function stopAudio()
  {
      scriptProcessorNode.onaudioprocess = null;
  }

  function startAudio()
  {
      //onaudioprocess är en eventhandler. 
      scriptProcessorNode.onaudioprocess = function(e){
          var timeVector = e.inputBuffer.getChannelData(0); //Hämta vektorn med audioData
          audioWindow.set(audioWindow.subarray(timeVector.length)); // fixa med hamming
          audioWindow.set(timeVector,audioWindowSize - timeVector.length); // fixa med hamming
          applyHamming(audioWindow,audioWindowProcessed); // lägg hamming
          fft.forward(audioWindowProcessed);  //gör fast fourier transform

          $scope.spectrum = fft.spectrum;    //ta frekvensspektrumet 
          // console.log('spectrumlol');
          var peakInfo = getMaxPeak($scope.spectrum);  //hämta frekvens där vi har högst amplitud
          if (peakInfo["peakAmp"] > 0.5)    //använd bara peakar över 0.5 för bättre nogrannhet
          {
              var frequency = peakInfo["peakInd"]*sampleRate/audioWindowSize;   //omvandla till frekvens
              var noteInfo = getNoteInfo(frequency);      //Hämta info från noter
              updateTuner(noteInfo["noteIndex"],noteInfo["noteError"], noteInfo["noteFreq"]);
          }

      }
  }

  function browserNotSupported()
  {
      alert("Sorry. Your browser is not supported. Please use latest versions of either Chrome or Firefox.")
  }
  //allow audio from user
  $scope.initAudio = function () {
      // console.log('initAudio')
      if (!navigator.getUserMedia)
      {
          navigator.getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
      }

      if (!navigator.getUserMedia)
      {
          browserNotSupported();
      }

      audioContext.resume().then(function() {
        // which media input is used , 
        navigator.getUserMedia({audio:true}, gotStream, function(e) {
              // alert('Error getting audio');
              console.log(e);
          });
      })
  }


  $scope.$on('$viewContentLoaded', function(){
      $scope.initializeTuner();
      $scope.initAudio();
  }) ;

});

