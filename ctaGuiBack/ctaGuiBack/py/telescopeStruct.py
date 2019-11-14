
# [LINK]documentation: http://www.eso.org/projects/alma/develop/acs/OnlineDocs/ACS_Supported_BACI_Types.pdf
# section 3.3 monitors; page 16
# dict holding all the possible properties
props = dict()
GLOBAL_FREQ = 10000000
QUEUE_FREQ = 10000000
# ------------------------------------------------------------------
# property configs
# ------------------------------------------------------------------
props["doubleRWProp:TEST_JAVA_T1"] = {
    # polling dict
    'Polling': {
        # the command that starts the polling of the property
        'polling_command': ".doubleRWProp.get_sync()[0]",
        # any additional parameters that are used for polling
        'additional_parameters': {
            # the frequency that we poll the value with
            'polling_interval': 10000000,
            # etc.
        }
    },
    # monitoring dict
    'Monitor': {
        # the command that is used to create the monitor
        'monitoring_command': ".doubleRWProp",
        # any additional parameters that are used for monitoring
        'additional_parameters': {
            # the interval we monitor with
            'timer_trigger_interval': 10000000,
            # the delta value that sets the threshold when a value should be returned
            'value_trigger_delta': 0.2,
            # tell the component how to trigger (false -> trigger on timer; true -> trigger on delta value)
            'is_monitor_value': False
        }
    },
    # Database dict
    'Database': {
        # no implemented yet
    },
    # the name of the component that has the property we want to monitor
    'component_name': 'TEST_JAVA_T1'

}

props["doubleRWProp:TEST_JAVA_T2"] = {
    'Polling': {
        'polling_command': ".doubleRWProp.get_sync()[0]",
        'additional_parameters': {
            'polling_interval': 20000000,
        }
    },
    'Monitor': {
        'monitoring_command': ".doubleRWProp",
        'additional_parameters': {
            'timer_trigger_interval': 20000000,
            'value_trigger_delta': 0.2,
            'is_monitor_value': False
        }
    },
    'Database': {
        # no implemented yet
    },
    'component_name': 'TEST_JAVA_T2'
}

props["name:supervisor"] = {
    'Polling': {
        'polling_command': ".name",
        'additional_parameters': {
            'polling_interval': 20000000,
        }
    },
    'Monitor': {
        # not a baci property
    },
    'Database': {
        # no implemented yet
    },
    'component_name': 'supervisor'
}
# ------------------------------------------------------------------
# global monitoring config
# ------------------------------------------------------------------
# just add all the properties you want to monitor globally to the dict
props["TEST_JAVA_T1"] = {
    # the name of the component that we want to monitor the properties on
    'component_name': 'TEST_JAVA_T1',
    # list of tuples that contain the property and the polling code for it
    'props': [
        # structure (property_name, polling_code)
        ('doubleRWProp', '.doubleRWProp.get_sync()[0]')
    ]
}

props["TEST_JAVA_T2"] = {
    'component_name': 'TEST_JAVA_T2',
    'props': [
        ('doubleRWProp', '.doubleRWProp.get_sync()[0]')
    ]
}
