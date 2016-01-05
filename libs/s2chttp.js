/*
Jan 2nd, 2015
S2C.io HTTP Library for Beaglebone Black
*/

var fs 		= require('fs');
var b 		= require('bonescript');
var http 	= require('http');
var os		= require('os');
var ver = 23;
var version = '0.0.'+ver;
var PushInterval 	= 10;   // push interval in secs
var to 				= new Date();
var uptime 			= (new Date())-to;
var gateway 		= new gateway('mybbb','','0'); // global variable gateway
printData = function(x)
	{
		gateway.bonescript   	= x.bonescript;
		gateway.macaddr  		= x.serialNumber;
		gateway.uptime   		= RND(uptime/1000);
		console.log('MacAddr ' + x.serialNumber)
	}

// startup
console.log('----------------------------------')
console.log('-   S2C.io HTTP  v '+version+'   -')
console.log('----------------------------------')

console.log('Client IP: ' + getIPAddress() );


function Create(name)
{
	gateway.name=name;
	gateway.uptime=RND(uptime/1000);
	gateway.localIP=getIPAddress();
	b.getPlatform(printData);
	console.log(gateway);
	return gateway;
}



// Name		Pin#    Pin#   Name
//   -       -       32    Vdd_ADC
// AIN4		 33      34    GND_ADC
// AIN6      35      36    AIN5
// AIN2      37      38    AIN3
// AIN0      39      40    AIN1
// callback functions
function command_handler(x)
{
	console.log('command_handler(command): '+x);
}
function admin_handler(x)
{
	console.log('admin_handler(command): '+x);
}
function loop()
	{
		gateway.uptime  = RND(((new Date())-to)/1000,1) ;
		var data = JSON.stringify(gateway);
		console.log('data : '+data+'\n\n');
		//console.log(gateway.sensorList[0].channels[0].remote(5))
		socket.emit('message', data);
	}

function gateway(name,macaddr,uptime)
	{
		this.macaddr	=	macaddr;
		this.name       =	name;
		this.uptime 	= 	uptime;
		this.localIP    =	'0.0.0.0';
		this.API_KEY 	= 'ABDCD'
		this.Throttle   = 30;
		this.Tolerance  = 50; // %
		this.connect    =   false;
		this.sensorList	=	[];   		// array that contains the sensors management
		this.SensorDataList	=	[];   		// array that contains the sensors data ONLY no management
		this.sensorsNames = [];
		this.ValueList   = [];
		this.InternalClk = (new Date()).valueOf();
		this.DeltaClk = 100000;
		this.SetChannel = function(sensorname,channelname,value,time,error)
			{
				var s	=	this.sensorsNames.indexOf(sensorname);
				var c	=	this.sensorList[s].channelNames.indexOf(channelname);
				if(s != -1 && c != -1)
				{
					this.sensorList[s].channels[c].value 	= value;
					this.sensorList[s].channels[c].time 	= time;
					//this.sensorList[s].channels[c].error 	= error;
					
					this.SensorDataList[s].channels[c].value 	= value;
					this.SensorDataList[s].channels[c].time 	= time;
					//console.log('Set Channel /'+sensorname+'/'+channelname+' to value = '+value+' at time = '+time);
				}
			}
		this.publish = function()     	// send the data to the cloud
			{
				var gatpost 		= {}
				var push 			= false;
				var macaddr 		= this.macaddr;
				var API_KEY         = this.API_KEY;
				gatpost.ip   		= this.localIP;
				gatpost.macaddr   	= macaddr;
				gatpost.sensorList	= this.SensorDataList;   // need only the data for push
				var data    		= JSON.stringify(gatpost);
				
				var cnt = 0;
				var PerC = 0;				
				for (var s=0; s<this.sensorList.length; s++) 
				{ 
					for(var c=0;c<this.sensorList[s].channels.length;c++) 
					{
						var nval = this.sensorList[s].channels[c].value;
						if(cnt>=this.ValueList.length)  { this.ValueList.push(nval); 	}  // handle the case when ValueList is empty
						else 	{ 
									var oldval 			= this.ValueList[cnt];
									this.ValueList[cnt]	= nval;
									if (oldval != 0) { PerC = Math.round(Math.abs(100*(nval-oldval)/oldval)); }
									if (PerC>this.Tolerance)
										{
											console.log('old val = '+oldval+' val = '+nval+' PerC = '+PerC);
											push = true;
										}										
								}
						cnt++;
					}  
				}
				if(push && (this.DeltaClk>=this.Throttle*100))
				{
					console.log('PUSH '+this.ValueList);
					console.log('DeltaClk = '+this.DeltaClk);
					this.InternalClk 	= (new Date()).valueOf();
					console.log(JSON.stringify(gatpost));
					POST(data,macaddr,API_KEY,post_callback);
				}
				else if(this.DeltaClk>=this.Throttle*1000)
				{
					this.InternalClk 	= (new Date()).valueOf();
					console.log('DeltaClk = '+this.DeltaClk);
					console.log('PERIODIC = '+this.ValueList);
					console.log(JSON.stringify(gatpost));
					POST(data,macaddr,API_KEY,post_callback);
				}
				this.DeltaClk 		= (new Date()).valueOf() - this.InternalClk;
				
				
				
				
			}
		this.AddSensor = function(sensor) 
		{
			// 1. make sure the name is unique
			for (var jk=0; jk<this.sensorList.length; jk++) { this.sensorsNames.push(this.sensorList[jk].name)}
			var index	=	this.sensorsNames.indexOf(sensor.name);				
			if(index	==	-1) {  this.sensorList.push(sensor) }
			else 
				{ 
					throw("Error: make sure the sensor name '"+sensor.name+"' is unique"); 
				}
			// 2. sort the channels by name
			this.sensorsNames = [];
			for (var jk=0; jk<this.sensorList.length; jk++) { this.sensorsNames.push(this.sensorList[jk].name)}
			this.sensorsNames.sort();
			console.log(this.sensorsNames)
			// 3. Rearrange channels
			var temp = [];
			for (var jk=0; jk<this.sensorList.length; jk++) { temp.push(this.sensorList[jk])}
			this.sensorList = [];
			this.SensorDataList	=	[]; 
			//console.log('temp = '+JSON.stringify(temp));
			for (item in this.sensorsNames) 
			{
				for(var jk=0; jk<temp.length; jk++)
				{
					if(temp[jk].name==this.sensorsNames[item])
						{
							this.sensorList.push(temp[jk])
							var sensdata = new sensorData(temp[jk].name,temp[jk].type,temp[jk].id,temp[jk].channels);
							this.SensorDataList.push(sensdata); 
						}
				}
			}
		}
	}
// Template Sensor Class
function sensorData(name,type,id,channels)
{
	this.name			= name;
	this.type			= type;
	this.id 			= id;
	this.channels		= channels;
}
function sensor(name,type,id)
{
	this.name			= name;
	this.type			= type;
	this.id 			= id;
	this.channels		= [];
	this.channelNames   = [];	  // array that contains only the channel names
	this.AddChannel		= function(name,value,unit) 
		{
			// 1. make sure the name is unique
			var index	=	this.channelNames.indexOf(name);				
			if(index	==	-1) 
			{ 
				var nsensor = new channel(name,0,unit,0,''); 
				this.channels.push(nsensor);	
				this.channelNames.push(name);
				console.log('New Channel Created '+name);
			}
			else 
				{ 
					throw("Error: make sure the channel name '"+name+"' is unique"); 
				}
			// 2. sort the channels by name
			this.channelNames.sort();
			//console.log(this.channelNames);
			// 3. Rearrange channels
			var temp = [];
			for (var jk=0; jk<this.channels.length; jk++) { temp.push(this.channels[jk])}
			this.channels = [];
			//console.log('temp = '+JSON.stringify(temp));
			for (item in this.channelNames) {for (var jk=0; jk<temp.length; jk++){if (temp[jk].name == this.channelNames[item]){this.channels.push(temp[jk])}}}
		}
	console.log('New Sensor Created '+this.name);
	
}

// Channel Class
function channel(name,value,unit)
	{
		this.name		=	name;
		this.value		=	value;
		this.unit		=	unit;
		this.time		=	0;
		//this.error		=	'';
	}

function getIPAddress() 
 {
  var interfaces = require('os').networkInterfaces();
  for (var devName in interfaces) {
    var iface = interfaces[devName];
    for (var i = 0; i < iface.length; i++) {
      var alias = iface[i];
      if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal)
        return alias.address;
    }
  }
  return '0.0.0.0';
} 

function POST(data,macaddr,API_KEY,post_callback)
	{
		var http = require("http");
		var options = 
		{
			hostname: 'developer.sensors2cloud.com',
			port: 80,
			path: '/arduino',
			method: 'POST',
			headers: {'Content-Type': 'application/json','Content-Length': data.length,'macaddr':macaddr,'securekey':API_KEY}
		};
		var req = http.request(options, function(res)
			{
				res.setEncoding('utf8');  
				res.on('data', function (body) { post_callback(body); }); 
			});
		req.on('error', function(e)            { post_callback(e.message); });
		// write data to request body
		req.write(data);
		req.end();
	}
function post_callback(resp)
	{
		console.log('POST response  '+resp);
	}
// Useful functions
function RND(x,d) {return Math.round(x*Math.pow(10,d))/Math.pow(10,d);}
function gpio_write_callback(x)
{
 console.log('GPIO_WRITE' + x); 
 var data=JSON.parse(x); 
 var pin=data.pin; 
 var val=data.value; 
 LockArray.push(pin)
 try
 {
	 b.pinMode(pin, b.OUTPUT,function(x){console.log('pinMode Error '+x.err)}); 
	 var status = b.digitalWrite(pin, val,function(x){console.log('GPIO_WRITE Error '+x.err)}); 
	 b.pinMode(pin, b.INPUT,function(x){console.log('pinMode Error '+x.err)});
	 console.log('GPIO_WRITE status '+status)	 
 }
 catch(e)
 {
	console.log('gpio_write_callback(x) Error '+e.message)
 }
 LockArray.remove(pin);
}
// modules exports here
module.exports = {
	Create: Create,
    RND: RND,
	sensor:sensor,
	channel:channel,	
}
