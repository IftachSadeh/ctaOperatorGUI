import argparse
import os


def parse_args(app_name):
    parser = argparse.ArgumentParser(description='Command line parser:')
    parser.add_argument(
        '--site_type',
        type=str,
        default=None,
    )
    parser.add_argument(
        '--app_port',
        type=int,
        default=None,
    )
    parser.add_argument(
        '--app_host',
        type=str,
        default=None,
    )
    parser.add_argument(
        '--reload',
        type=str_to_bool,
        nargs='?',
        const=True,
        default='True',
    )
    parser.add_argument(
        '--redis_port',
        type=int,
        default=None,
    )
    parser.add_argument(
        '--app_workers',
        type=int,
        default=1,
    )
    parser.add_argument(
        '--log_file',
        type=str,
        default=None,
    )
    parser.add_argument(
        '--log_level',
        type=str,
        default=None,
    )
    parser.add_argument(
        '--debug_opts',
        type=str,
        default=None,
    )
    parser.add_argument(
        '--is_simulation',
        type=str_to_bool,
        nargs='?',
        const=True,
        default='True',
    )
    parser.add_argument(
        '--do_flush_redis',
        type=str_to_bool,
        nargs='?',
        const=True,
        default='False',
    )
    parser.add_argument(
        '--allow_panel_sync',
        type=str_to_bool,
        nargs='?',
        const=True,
        default='True',
    )
    input_args = vars(parser.parse_args())

    try:
        module_names = ['ctaGuiBack', 'ctaGuiFront', 'ctaGuiUtils']

        # list here all views, which use the shared view function
        # these would eg be mapped to: [ http://localhost:8090/cta/view200 ]
        widget_infos = [
            'view102',
            'view000',
            'view_refresh_all',
            'view200',
            'view201',
            'view202',
            'view203',
            'view204',
            'view205',
            'view206',
            'view207',
        ]

        # for safety, make sure registered widgets can be requested by the client
        # e.g., expect a module file named 'AAA.py', containing a class AAA
        allowed_widget_types = {
            'synced': [
                'ArrZoomerView',
                'PlotsDash',
                'SubArrGrp',
                'telPntSky',
                'SchedBlocks',
                'NightSched',
                'inst_pos_0',
                'ObsBlockControl',
                'EmptyExample',
                'CommentSched',
                'SchedBlockController',
                'SchedBlockInspector',
                'WeatherMonitoring',
            ],
            'not_synced': [
                'PanelSync',
            ]
        }

        pwd = os.getcwd()
        sqlite = 'sqlite:////' + os.path.join(pwd, (app_name + '.db'))
        # 'sqlite://///Users/sadeh/test/ctaOperatorGUI/ctaGuiFront/ctaGuiFront.db',

        settings = {
            'app_name': app_name,
            'app_prefix': 'cta',
            'app_host': '0.0.0.0',
            'log_file': 'logs/' + app_name + '_server.log',
            # 'log_level': 'DEBUG',
            'log_level': 'INFO',
            # 'log_level': 'WARN',
            # 'log_level': 'ERROR',
            'pyramid.reload_templates': 'true',
            'sqlalchemy.url': sqlite,
            'module_names': module_names,
            'widget_infos': widget_infos,
            'allowed_widget_types': allowed_widget_types,
        }

        if input_args['site_type'] == 'N':
            settings.update({
                'app_port': '8090' if (app_name == 'ctaGuiFront') else '8091',
                'redis_port': '8092',
            })
        elif input_args['site_type'] == 'S':
            settings.update({
                'app_port': '8093' if (app_name == 'ctaGuiFront') else '8094',
                'redis_port': '8095',
            })
        else:
            raise ValueError('must specify --site_type as "N" or "S"')

        # debugging options
        allowed_debug_opts = {
            'dev': True,
            'redis': True,
            'lock': False,
        }
        if input_args['debug_opts'] is None:
            input_debugs = []
        else:
            input_debugs = str(input_args['debug_opts']).split(',')

        settings['debug_opts'] = dict()
        for debug in allowed_debug_opts.keys():
            settings['debug_opts'][debug] = (
                True if (debug in input_debugs) else allowed_debug_opts[debug]
            )

        for k, v in input_args.items():
            if v is not None:
                settings[k] = v

    except Exception as e:
        raise e

    return settings


#
def str_to_bool(v):
    if v.lower() in ('yes', 'true', 't', 'y', '1'):
        return True
    elif v.lower() in ('no', 'false', 'f', 'n', '0'):
        return False
    else:
        raise argparse.ArgumentTypeError('Boolean value expected')
