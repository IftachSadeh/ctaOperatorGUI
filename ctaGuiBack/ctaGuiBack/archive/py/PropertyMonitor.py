# ------------------------------------------------------------------
# imports
# ------------------------------------------------------------------
from ctaGuiUtils.py.utils import HMILog
from ctaGuiUtils.py.utils import tel_ids, redis_port
import threading
import time
from collections import Counter
import redis
import json
import jsonAcs
# Import ACS
import ACS__POA
from ACS import CBDescIn
from Acspy.Clients.SimpleClient import PySimpleClient
from Acspy.Common.Callbacks import CBvoid
# from Acspy.Common.Callbacks import CBdouble
from TelescopeStruct import props, GLOBAL_FREQ, QUEUE_FREQ

desc = CBDescIn(5L, 0L, 0L)


# ------------------------------------------------------------------
# Threading and Callback classes
# ------------------------------------------------------------------
class PollingThread(threading.Thread):
    """
    class that defines the thread used for polling
    """
    def __init__(self, *args, **kwargs):
        super(PollingThread, self).__init__(*args, **kwargs)
        self._stop = threading.Event()

    # methods used for stopping the thread
    def stop(self):
        self._stop.set()


class MonitorCB(ACS__POA.CBdouble):
    """
    class that defines the callback for the acs components
    """
    def __init__(self, key):
        self.log = HMILog(title=__name__)
        self.key = key
        self.r = redis.StrictRedis(host='localhost', port=6379, db=0)

    def done(self, completion, desc, a):
        """
        this method is called when monitoring ends and it writes to redis
        """
        # sets the values into redis; title 10
        self.r.setex(self.key, 10, json.dumps({'status': 'done', 'value': completion}))
        self.log.info([['g', (" - PropertyMonitorLocal.done.%s - ") % (self.key)],
                       ['p', completion]])

    def working(self, completion, desc, a):
        """
        this method is called when monitoring and it writes to redis
        """
        self.r.setex(self.key, 10, json.dumps({'status': 'working', 'value': completion}))
        self.log.info([['g', (" - PropertyMonitorLocal.working.%s - ") % (self.key)],
                       ['p', completion]])


# Prefix constants
# global monitoring component prefix
COMPONENT_PREFIX_GLOBAL = 'ACS:G'
# local monitoring component prefix
COMPONENT_PREFIX_LOCAL = 'ACS:L'
# name of the queue used for monitoring
QUEUE_NAME = 'ACS:MonitorQueue'
# name of the queue used for polling
POLLING_QUEUE = 'ACS:PollingQueue'
# name of the queue used for querying from db
MONGO_QUEUE = 'ACS:MongoQueue'
# prefix of the dicts used for comparing the values in the db
DICT_SET_NAME = 'ACS:DictSet'
# the monitoring dictionary that contains the references of all active monitors
MONITOR_DICT = 'ACS:Monitor:Dict'

# Create a client and the ArraySupervisor component
client = PySimpleClient()
supervisor = client.getComponent("ArraySupervisor")

# Local property monitor dict
local_queue = Counter()
# dict used for storing active polling threads
polling_threads = dict()
# dict for storing references to the components
dict_of_components = dict()

# get the components
TEST_JAVA_T1 = client.getComponent("TEST_JAVA_T1")
TEST_JAVA_T2 = client.getComponent("TEST_JAVA_T2")
# you can add more here

# add the components to the dict
dict_of_components[TEST_JAVA_T1.name] = TEST_JAVA_T1
dict_of_components[TEST_JAVA_T2.name] = TEST_JAVA_T2


# ------------------------------------------------------------------
# PropertyMonitor classes
# ------------------------------------------------------------------
class PropertyMonitorQueue:
    def __init__(self, site_type):

        self.log = HMILog(title=__name__)
        self.log.info([['y', " - PropertyMonitor Queue - "], ['g', site_type]])

        self.site_type = site_type
        self.tel_ids = tel_ids[site_type]

        self.r = redis.StrictRedis(host='localhost', port=redis_port[site_type], db=0)

        # to be on a safe side, clean the counter
        self.r.delete(DICT_SET_NAME)

        t = threading.Thread(target=self.queue_parser_loop)
        # set the thread to daemon for quicker termination
        t.daemon = True
        t.start()
        return

    def queue_parser_loop(self):
        """
        this method calls the queue_parser method every second
        """
        while True:
            self.queue_parser()
            time.sleep(QUEUE_FREQ / 10000000)

    def queue_parser(self):
        """
        This method gets the list from the monitoring queue in redis. The values
        # get parsed and put into a counter dict.
        :return: a counter dict of components subscriptions
        """
        #####
        # Monitoring queue
        #####
        for _ in self.r.lrange(QUEUE_NAME, 0, 1000):
            # Pop the element from queue and parse it
            pop = self.r.rpop(QUEUE_NAME)
            # split the pop'ed string
            pop_command = pop.split(':', 1)[0]
            pop_tel = pop.split(':', 1)[1]
            pop_tel = "Monitor:" + pop_tel
            # Depending on the prefix increment or decrement the counter
            if pop_command == 'UNSUB':
                self.log.info([['g', " - PropertyMonitorQueue.queue_parser.UNSUB - "],
                               ['p', pop_tel]])
                # Check if key value is lower than 0
                if local_queue[pop_tel] <= 0:
                    local_queue.pop(pop_tel, None)
                else:
                    local_queue[pop_tel] -= 1
            else:
                self.log.info([['g', " - PropertyMonitorQueue.queue_parser.SUB - "],
                               ['p', pop_tel]])
                local_queue[pop_tel] += 1
            print local_queue

        #####
        # Polling queue
        #####
        for _ in self.r.lrange(POLLING_QUEUE, 0, 1000):
            # Pop the element from queue and parse it
            pop = self.r.rpop(POLLING_QUEUE)
            pop_command = pop.split(':', 1)[0]
            pop_tel = pop.split(':', 1)[1]
            pop_tel = "Polling:" + pop_tel
            # Depending on the prefix increment or decrement the counter
            if pop_command == 'UNSUB':
                # Check if key value is lower than 0
                if local_queue[pop_tel] <= 0:
                    local_queue.pop(pop_tel, None)
                else:
                    local_queue[pop_tel] -= 1
            else:
                local_queue[pop_tel] += 1
            print local_queue

        #####
        # Database queue
        #####
        for _ in self.r.lrange(MONGO_QUEUE, 0, 1000):
            # Pop the element from queue and parse it
            pop = self.r.rpop(MONGO_QUEUE)
            pop_command = pop.split(':', 1)[0]
            pop_tel = pop.split(':', 1)[1]
            pop_tel = "Mongo:" + pop_tel
            # Depending on the prefix increment or decrement the counter
            if pop_command == 'UNSUB':
                # Check if key value is lower than 0
                if local_queue[pop_tel] <= 0:
                    local_queue.pop(pop_tel, None)
                else:
                    local_queue[pop_tel] -= 1
            else:
                local_queue[pop_tel] += 1
            print local_queue


class PropertyMonitorGlobal:
    def __init__(self, site_type):

        self.log = HMILog(title=__name__)
        self.log.info([['y', " - PropertyMonitor Global - "], ['g', site_type]])

        self.site_type = site_type
        self.tel_ids = tel_ids[site_type]

        self.r = redis.StrictRedis(host='localhost', port=redis_port[site_type], db=0)
        t = threading.Thread(target=self.tel_global_loop)
        # set the thread to daemon for quicker termination
        t.daemon = True
        t.start()
        return

    def tel_global_loop(self):
        """
        this method calls monitor_component_status every second
        """
        while True:
            self.monitor_component_status()
            time.sleep(GLOBAL_FREQ / 10000000)

    def monitor_component_status(self):
        """
        This method monitors the global properties of the components and
        # writes the values into redis.
        :return:
        """
        # for each component in the dict
        for x in dict_of_components.keys():
            # Build the component property dict
            comp_prop_dict = dict()
            # get the config for the global component
            glob = props.get(x)
            # for each property in the global component
            for xy in glob["props"]:
                # eval the pollin command and save to dict
                comp_prop_dict[xy[0]] = eval(glob["component_name"] + [xy[1]][0])
                self.log.info([[
                    'g', (" - PropertyMonitorGlobal.monitor_component_status.%s.%s - ") %
                    (glob["component_name"], xy[0])
                ], ['p', eval(glob["component_name"] + [xy[1]][0])]])
                # Create key for the component
                rkey = COMPONENT_PREFIX_GLOBAL + ':%s' % x
                # Save the dict into redis
                self.r.set(rkey, json.dumps(comp_prop_dict))
                self.r.set(COMPONENT_PREFIX_GLOBAL, dict_of_components)


class PropertyMonitorLocal:
    def __init__(self, site_type):

        self.log = HMILog(title=__name__)
        self.log.info([['y', " - PropertyMonitor Local - "], ['g', site_type]])

        self.site_type = site_type
        self.tel_ids = tel_ids[site_type]
        self.r = redis.StrictRedis(host='localhost', port=redis_port[site_type], db=0)

        t = threading.Thread(target=self.tel_local_loop)
        # set the thread to daemon for quicker termination
        t.daemon = True
        t.start()
        return

    def get_redis(self):
        """
        :return: the instance of the redis client
        """
        return self.r

    def tel_local_loop(self):
        """
        this method calls monitor_component_properties every second
        """
        while True:
            self.monitor_component_properties()
            time.sleep(1)

    # Polling generator
    def sub_polling(self, component, params, key, command):
        """
        this method returns the code for getting the value of a specific prop in polling mode
        :param component: the component that has the prop
        :param params: dict of additional parameters
        :param key: the key used to build the redis key
        :param command: command used for polling
        :return: code for getting a prop value in polling mode
        """
        # create the string containing the code
        command_str = "%s%s" % (component, command)
        print "started polling " + key + " with frequency:" + \
            str(params["polling_interval"])

        # save the return value
        while local_queue.get("Polling:" + key) > 0:
            # eval the string and save the value
            value = eval(command_str)
            print key + ": " + str(value)
            # save the value into redis
            # Build local component key
            rkey_local = COMPONENT_PREFIX_LOCAL + ':Polling:%s' % key
            set_name = DICT_SET_NAME + ':%s' % key

            # check if the value in redis different
            if self.r.sadd(set_name, value):
                # recreate the set
                self.r.delete(set_name)
                self.r.sadd(set_name, value)
                # Push to local component key; TTL 10sec
                self.r.setex(rkey_local, 10, value)
            else:
                continue
            # sleep for x seconds where x is specified in the config
            time.sleep(int(params["polling_interval"] / 10000000))

    # Monitor generator
    def sub_monitoring(self, component, params, command):
        """
        this method creates a string that contains monitor creation code

        :param component: the name of the component we are monitoring on
        :param params: dict of params (default monitoring rate etc.
        :param command: the command to create the monitor
        :return: monitor creation string
        """
        # creates monitor for the specified component and prop
        mon_create = "mon=%s%s.create_monitor(client.activateOffShoot(cb), desc)" % (
            component, command
        )
        # set the monitoring interval
        mon_timer_trigger = "mon.set_timer_trigger(%d)" % int(
            params["timer_trigger_interval"]
        )
        # create the final string that will be exec'ed
        mon_setup = mon_create + "\n" + mon_timer_trigger + "\n" + \
            "mon.set_value_trigger(%i, %s)" % (
                params["value_trigger_delta"], params["is_monitor_value"])
        return mon_setup

    def create_monitor(self, rkey_local, key):
        """
        spawn a new monitor in a greenlet
        :param rkey_local: the key used for redis
        :param key: component name to get the properties from the config

        """
        cb = MonitorCB(rkey_local)
        # creates the monitor from the generated string
        exec (
            self.sub_monitoring(
                props[key]['component_name'],
                props[key]["Monitor"]["additional_parameters"],
                props[key]["Monitor"]["monitoring_command"]
            )
        )
        # adds the reference to the newly created monitor to monitors dict
        encoded_mon = jsonAcs.encode(mon)
        # add the newly created monitor reference to the hset in redis
        self.r.hset(MONITOR_DICT, key, encoded_mon)

    def monitor_component_properties(self):
        """
        This method monitors the local properties of a component.
        # Monitoring occurs only for the components that has subs
        listening. Monitoring can be done on three different ways
        # (BACI, Polling or get history from MongoDB)
        """
        for key in local_queue.keys():
            # parse to get the property name without the prefix
            monitor_key = key.split(':', 1)[1]

            if local_queue[key] == 0 and monitor_key in polling_threads.keys():
                # get the thread of the property
                t = polling_threads.pop(monitor_key, None)
                # stop the thread
                t.stop()
                print key + " thread removed."
            # check if the property has a monitor when the counter reaches 0
            if local_queue[key] == 0 and self.r.hexists(MONITOR_DICT, monitor_key):
                # get the monitor from redis hset
                redis_monitor = self.r.hget(MONITOR_DICT, monitor_key)
                m = jsonAcs.decode(redis_monitor)
                # destroy the monitor
                m.destroy()
                print key + " monitor removed."
                # remove the monitor key from the hset in redis
                self.r.hdel(MONITOR_DICT, monitor_key)

            if local_queue[key] > 0:
                # split the key to check what kind of monitoring is needed
                key_prefix = key.split(':', 1)[0]
                key = key.split(':', 1)[1]
                # dict used for saving data to redis
                tel_prop_dict = dict()
                # when there are 0 subscribers to a key check if monitor exists

                if key_prefix == "Monitor":
                    tel_prop_dict[key] = ""
                    # Build local component key
                    rkey_local = COMPONENT_PREFIX_LOCAL + ':Monitor:%s' % key
                    set_name = DICT_SET_NAME + ':%s' % key
                    # check the redis hset if the monitor exists
                    if not self.r.hexists(MONITOR_DICT, monitor_key):
                        self.create_monitor(rkey_local, key)
                        print "Added monitor for property " + key + "."

                    # check if the value in redis different
                    if self.r.sadd(set_name, json.dumps(tel_prop_dict)):

                        # recreate the set
                        self.r.delete(set_name)
                        self.r.sadd(set_name, json.dumps(tel_prop_dict))
                        # Push to local component key; TTL 10sec
                        self.r.setex(rkey_local, 10, json.dumps(tel_prop_dict))

                    else:
                        continue

                elif key_prefix == "Polling":
                    # if a thread for the current property doesn't exist, create it
                    if key not in polling_threads.keys():
                        # create a polling thread
                        t = PollingThread(
                            target=self.sub_polling,
                            args=(
                                props[key]["component_name"],
                                props[key]["Polling"]["additional_parameters"], key,
                                props[key]["Polling"]["polling_command"]
                            )
                        )
                        polling_threads[key] = t
                        t.start()

                # todo: not implemented yet
                elif key_prefix == "Mongo":
                    print "DB not supported yet"
                else:
                    print "unsupported monitoring"
