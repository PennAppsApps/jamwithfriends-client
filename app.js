var prompt = require('prompt');
launchpadName = "";

prompt.start();

prompt.get(['ip', 'name'], function(e, r){
  launchpadName = r.name;
  socket = require('socket.io-client')(r.ip || "ws://158.130.165.151:3000");
  // console.log(r.ip);

  socket.on('connect', function(d){
    console.log('hello received');
    // we're connected
    socket.on('session:name', function(){
      console.log('sending session name');
      socket.emit('session:name', '');
    });

    socket.on('device:select', function(){
      console.log('sending launchpad info');
      socket.emit('device:select', {id: 'launchpad', name: launchpadName});

      // var launchpad = require('midi-launchpad').connect(0, false);
      var midi = require('midi');

      // set up raw midi if user doesn't want to programmatically do shit
      // for example, this would be useful in FL Studio/Ableton Live
      var output = new midi.output();
      output.openPort(0);
      socket.on('midi:message', function(msg){
        output.sendMessage(msg);
      });

      var input = new midi.input();
      input.on('message', function(delta, msg){
        socket.emit('midi:message', msg);
      });
      input.openPort(0);

      launchpad.on('ready', function(launchpad){
        // clear before anything, it breaks toggle if not cleared
        launchpad.clear();
        // launchpad.allLight(launchpad.colors.green.high);

        // START LAUNCHPAD TRIGGERS
        launchpad.on('press', function(button){
          socket.emit('button:press', {x: button.x, y: button.y});
        });

        launchpad.on('release', function(button){
          socket.emit('button:release', {x: button.x, y: button.y});
        });
        // END LAUNCHPAD TRIGGERS

        // START LAUNCHPAD ACTIONS
        socket.on('button:light', function(d){
          launchpad.getButton(d.x, d.y).light(d.color);
        });

        socket.on('button:off', function(d){
          launchpad.getButton(d.x, d.y).dark();
        });

        socket.on('button:toggle', function(d){
          var button = launchpad.getButton(d.x, d.y);
          if(button.getState() === 0){
            button.light(d.color || 3);
          }else{
            button.dark();
          }
        });

        socket.on('button:light:all', function(d){
          launchpad.allLight(d.color || 3);
        });
        // END LAUNCHPAD ACTIONS
      });
    });

    socket.emit('user:position', 1);
  })
});
