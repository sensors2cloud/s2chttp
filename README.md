# s2chttp
s2chttp Library for Node.js tested on beaglebone black

This Library is designed to let you easily connect you Beaglebone black to the cloud and push data in real-time. 
Using this Library and the attached client allow you to leverage the power of the s2c.io platform for your internet of things projects.

##Step 1. SSH to your beaglebone <br>
##Step 2. Install s2chttp library<br> 
      npm install s2chttp <br>
##Step 3. cd to /var/lib/cloud9  <br>
##Step 4. copy client into autorun directory<br>
      cp /var/lib/cloud9/node_modules/s2chttp/examples/s2c_io_client.js /var/lib/cloud9/autorun/s2c_io_client.js <br>
##Step 5. Edit the client
    cd /var/lib/cloud9/autorun
    vi s2c_io_client.js
    click insert
    navigate to gat.API_KEY = 'YOUR API KEY HERE'
    replace the API_KEY with the API KEY of your beaglebone obtained from s2c.io device manager > Edit Config > SecureKey
    click Esc
    type wq! then ENTER
##Step 6. Run the client
    node s2c_io_client.js
##Step 7. Verify that you get this acknowlegment
    POST response  S2C.io ACK Message: OK!. Request from IP: 117.xx.1.xx

    
    
