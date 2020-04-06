from pyramid.security import Allow, Everyone
from sqlalchemy import Column, Integer, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import scoped_session, sessionmaker
from zope.sqlalchemy import ZopeTransactionExtension
import transaction

db_session = scoped_session(sessionmaker(extension=ZopeTransactionExtension()))
sql_base = declarative_base()


# ------------------------------------------------------------------
# define the fctory that sets user privliges
# see: http://docs.pylonsproject.org/projects/pyramid/en/latest/narr/security.html#protecting-views
# ------------------------------------------------------------------
class RootFactory(object):
    __name__ = None
    __parent__ = None
    __acl__ = [
        # every group must have permission to view the index and the sockets
        (Allow, 'group:permit_1', 'permit_all'),
        (Allow, 'group:permit_2', 'permit_all'),
        # 'group:permit_1' has permission to access pages defined by 'permit_a' and by 'permit_b'
        (Allow, 'group:permit_1', 'permit_a'),
        (Allow, 'group:permit_1', 'permit_b'),
        # 'group:permit_2' has permission to access pages defined by 'permit_b' only
        (Allow, 'group:permit_2', 'permit_b')
    ]

    # __acl__ = [ (Allow, Everyone,         'permit_0'),
    #             (Allow, 'group:permit_1', 'permit_1')
    #           ]

    def __init__(self, request):
        pass


# ------------------------------------------------------------------
# users are defined by this class
# ------------------------------------------------------------------
class MyModel(sql_base):
    __tablename__ = 'models'
    id = Column(Integer, primary_key=True)
    userId = Column(Text, unique=True)
    passwd = Column(Integer)
    groups = Column(Text)


# ------------------------------------------------------------------
# initiate these users manually
# to reset the db, do:
#   rm ctaGuiFront.db ; $VENV/bin/initialize_tutorial_db development.ini
# ------------------------------------------------------------------
def init_user_passes():
    user_passes = [["guest", "123", "group:permit_1"], ["user0", "xxx", "group:permit_1"],
                   ["user1", "xxx", "group:permit_1"], ["user2", "xxx", "group:permit_2"]]

    for n_user_now in range(len(user_passes)):
        my_model = MyModel(
            userId=user_passes[n_user_now][0],
            passwd=user_passes[n_user_now][1],
            groups=user_passes[n_user_now][2]
        )

        user_filt = MyModel.userId == user_passes[n_user_now][0]
        my_model = db_session.query(MyModel).filter(user_filt).first()
        if my_model is None:
            print " - Adding user/pass: ", user_passes[n_user_now]
            db_session.add(my_model)
            transaction.commit()


# ------------------------------------------------------------------
# method for extracting the group list for a given user
# ------------------------------------------------------------------
def get_groups(user_id, request):
    db_lookup = db_session.query(MyModel).filter(MyModel.userId == user_id).first()

    if db_lookup != None:
        return (db_lookup.groups).split(";")
    else:
        return []
