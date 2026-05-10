function Soundmanager(){
    var sound = null;
    var target = "";
    var path = "";
    var currentID = -1;
    var count = 0;
    var status = 0;
    var sounds = [];
    var channels = [];
    var dur = 2;

    this.init = function(sTarget, sPath){
        target = sTarget;
        path = sPath;

        prepareSound();
    }

    function prepareSound(){
       var itms = $('#' + target + ' div').get();

       for(var i = 0; i < itms.length; i++){
           var ref = itms[i];
           $(ref).data("id", i);
           $(ref).data("status", 0);
           $(ref).data("arrNumber", 0);
           $(ref).on("click", handleSound);
           sounds.push($(ref).attr("id"));
       }
    }

    function handleSound(){
        currentID = $(this).data("id");
        dur = $(this).data("dur");

        switch($(this).data("status")){
            case 0:
                //if(channels[$(this).data("arrNumber")] === undefined){}
                //else channels[$(this).data("arrNumber")].stop();
                if($('.ringing').length >= 10) break;
                $(this).data("arrNumber", count);
                count++;
                sound = new buzz.sound( path + sounds[currentID], {
                    formats: [ "ogg", "mp3"],
                    preload: true,
                    autoplay: false,
                    loop: true
                });
                channels.push(sound);
                
                var img = $('img', this);
                var div = $(this);
                
                sound.bind("loadeddata", function(e) {
                    dur = sound.getDuration();
                    track = this;
                    img.css({ "animation-duration": dur/6 + "s" });
                    img.css({ "animation-name" : "swinging" });
                    img.attr("src", "bell-simulator/img/bell-brown-wo-clapper.svg");
                    img.after('<img class="clapper" src="./bell-simulator/img/clapper-brown.svg" style="animation-duration:'+dur/6+'s">');
                    setTimeout(function(){ track.play().setVolume(30).fadeTo(100, dur*1000/6) }, dur*1000/24);
                    div.data("dur", dur);
                });
                
                $(this).data("status", 1);
                $(this).addClass('ringing');
                break;
            case 1:
                channels[$(this).data("arrNumber")].fadeOut(dur**2.5*0.02*1000);
                $(this).data("status", 0);
                $(this).removeClass('ringing');
                $('img.clapper', this).remove();
                $('img', this).css({ "animation-name" : "none" });
                if($(this).text().includes("#")) $('img', this).attr("src", "./bell-simulator/img/bell-dark-grey.svg");
                else $('img', this).attr("src", "./bell-simulator/img/bell-light-grey.svg");
                break;
        }
    }
}