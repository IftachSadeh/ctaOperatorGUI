from   pyramid.security           import Allow, Everyone
from   sqlalchemy                 import Column, Integer, Text
from   sqlalchemy.ext.declarative import declarative_base
from   sqlalchemy.orm             import scoped_session, sessionmaker
from   zope.sqlalchemy            import ZopeTransactionExtension
import transaction

DBSession = scoped_session(sessionmaker(extension=ZopeTransactionExtension()))
Base      = declarative_base()

# -----------------------------------------------------------------------------------------------------------
# define the fctory that sets user privliges
# see: http://docs.pylonsproject.org/projects/pyramid/en/latest/narr/security.html#protecting-views
# -----------------------------------------------------------------------------------------------------------
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

# -----------------------------------------------------------------------------------------------------------
# users are defined by this class
# -----------------------------------------------------------------------------------------------------------
class MyModel(Base):
  __tablename__ = 'models'
  id = Column(Integer, primary_key=True)
  userId = Column(Text, unique=True)
  passwd = Column(Integer)
  groups = Column(Text)


# -----------------------------------------------------------------------------------------------------------
# initiate these users manually
# to reset the db, do:
#   rm ctaGuiFront.db ; $VENV/bin/initialize_tutorial_db development.ini
# -----------------------------------------------------------------------------------------------------------
def initUsers():
  userPassV = [
      ["guest","123","group:permit_1"],
      ["user0","xxx","group:permit_1"],
      ["user1","xxx","group:permit_1"],
      ["user2","xxx","group:permit_2"]
    ]

  # userPassV = [ ["guest","1234","group:permit_1"] , ["user0","1234","group:permit_1"] , ["user1","1234","group:permit_1"] , ["user2","1234","group:permit_2"]]
  for nUserNow in range(len(userPassV)):
    aModel = MyModel(userId=userPassV[nUserNow][0],passwd=userPassV[nUserNow][1],groups=userPassV[nUserNow][2])
    # print 'xxxxxxxxxxxxxxxxxxxxx',userPassV[nUserNow]

    if DBSession.query(MyModel).filter(MyModel.userId == userPassV[nUserNow][0]).first() == None:
      print " - Adding user/pass: ",userPassV[nUserNow]
      DBSession.add(aModel)
      transaction.commit()

# -----------------------------------------------------------------------------------------------------------
# method for extracting the group list for a given user
# -----------------------------------------------------------------------------------------------------------
def groupFinder(userId, request):
  dbLookup = DBSession.query(MyModel).filter(MyModel.userId == userId).first()
  
  if dbLookup != None: return (dbLookup.groups).split(";")
  else:                return []



