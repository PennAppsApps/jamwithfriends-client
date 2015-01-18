var prompt = require('prompt');

prompt.start();

prompt.get(['ip'], function(e, r){
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
      socket.emit('device:select', {id: 'launchpad'});

      var launchpad = require('midi-launchpad').connect(0, false);

      launchpad.on('ready', function(launchpad){
        // clear before anything, it breaks toggle if not cleared
        launchpad.clear();

        // START LAUNCHPAD TRIGGERS
        launchpad.on('press', function(button){
          socket.emit('button:press', {x: button.x, y: button.y});
        });

        launchpad.on('release', function(button){
          socket.emit('button:release', {x: button.x, button.y});
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
