/*
S2C.io
Beaglebone Sample Client
version: 0.9.0.1
*/
var b2c 	= require('s2chttp');
var b 		= require('bonescript');
var gat 	= b2c.Create('an');
gat.API_KEY = 'YOUR API KEY HERE'

var D 		= [[0,''],[0,''],[0,''],[0,''],[0,''],[0,''],[0,'']]; // hold the data
var loop_ctr= 0;

var an = new b2c.sensor('an','BB_ANALOG',166);
an.AddChannel('analog0',14,'N');
an.AddChannel('analog2',9,'N');
an.AddChannel('analog1',9,'N');
an.AddChannel('analog3',9,'N');
an.AddChannel('analog5',9,'N');
an.AddChannel('analog6',9,'N');
an.AddChannel('analog4',9,'N');
gat.AddSensor(an);


setInterval(__main__,5000); // create a timer to read the ANALOG inputs


function __main__()
{
	loop_ctr++;
	console.log('Update() ...'+loop_ctr);
	// Get Data from Analog Ports
	b.analogRead('P9_39', function(x){if(x.err == undefined) {D[0][0]= b2c.RND(x.value,3); D[0][1]='';	} else { D[0][1]=x.err; }});
	b.analogRead('P9_40', function(x){if(x.err == undefined) {D[1][0]= b2c.RND(x.value,3); D[1][1]='';	} else { D[1][1]=x.err; }});
	b.analogRead('P9_37', function(x){if(x.err == undefined) {D[2][0]= b2c.RND(x.value,3); D[2][1]='';	} else { D[2][1]=x.err; }}); 
	b.analogRead('P9_38', function(x){if(x.err == undefined) {D[3][0]= b2c.RND(x.value,3); D[3][1]='';	} else { D[3][1]=x.err; }}); 
	b.analogRead('P9_33', function(x){if(x.err == undefined) {D[4][0]= b2c.RND(x.value,3); D[4][1]='';	} else { D[4][1]=x.err; }});
	b.analogRead('P9_36', function(x){if(x.err == undefined) {D[5][0]= b2c.RND(x.value,3); D[5][1]='';	} else { D[5][1]=x.err; }});
	b.analogRead('P9_35', function(x){if(x.err == undefined) {D[6][0]= b2c.RND(x.value,3); D[6][1]='';	} else { D[6][1]=x.err; }});
	console.log('D = '+D);
	
	// update the channels
	gat.SetChannel('an','analog0',D[0][0],b2c.RND((new Date()).valueOf()/1000,0),'');
	gat.SetChannel('an','analog1',D[1][0],b2c.RND((new Date()).valueOf()/1000,0),'');
	gat.SetChannel('an','analog2',D[2][0],b2c.RND((new Date()).valueOf()/1000,0),'');
	gat.SetChannel('an','analog3',D[3][0],b2c.RND((new Date()).valueOf()/1000,0),'');
	gat.SetChannel('an','analog4',D[4][0],b2c.RND((new Date()).valueOf()/1000,0),'');
	gat.SetChannel('an','analog5',D[5][0],b2c.RND((new Date()).valueOf()/1000,0),'');
	gat.SetChannel('an','analog6',D[6][0],b2c.RND((new Date()).valueOf()/1000,0),'');
	
	// push data to the cloud
	gat.publish()
}


//console.log(gat.sensorList[1].channels[1]);

