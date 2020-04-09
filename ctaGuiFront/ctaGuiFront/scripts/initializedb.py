import os
import sys
# import transaction

from sqlalchemy import engine_from_config
from pyramid.paster import get_appsettings, setup_logging
from ctaGuiFront.py.utils.Models import db_session, sql_base, init_user_passes


def usage(argv):
    cmd = os.path.basename(argv[0])
    print('usage: %s <config_uri>\n' '(example: "%s development.ini")' % (cmd, cmd))
    sys.exit(1)


def main(argv=sys.argv):
    if len(argv) != 2:
        usage(argv)

    config_uri = argv[1]

    setup_logging(config_uri)

    settings = get_appsettings(config_uri)
    engine = engine_from_config(settings, 'sqlalchemy.')

    db_session.configure(bind=engine)
    sql_base.metadata.create_all(engine)
    # with transaction.manager:
    #     model = Page('FrontPage', 'This is the front page')
    #     db_session.add(model)

    init_user_passes()
