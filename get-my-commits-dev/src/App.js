import './App.css';
import { Octokit } from 'octokit';
import { useState, useRef, useEffect } from 'react';
import styled, { ThemeProvider, keyframes } from 'styled-components';

const StatusEnum = {
  None: '',
  Failed: '0x274C',
  Success: '0x2705',
};

const GetEnum = {
  None: 'None',
  Failed: 'Failed',
  Success: 'Success',
};

const BaseDates = {
  Spring: new Date(new Date().getFullYear(), 0, 1),
  Summer: new Date(new Date().getFullYear(), 4, 15),
  Fall: new Date(new Date().getFullYear(), 7, 20),
};

const GetBaseDate = () => {
  const mp = { 1: 'Spring', 2: 'Summer', 3: 'Fall' };

  const which = Object.keys(BaseDates).reduce((p, k) => {
    return p + (new Date() > BaseDates[k] ? 1 : 0);
  }, 0);

  return BaseDates[mp[which]];
};

const ISODate = (d) => {
  return d.toISOString().split('T')[0];
};

const Row = styled.div`
  display: flex;
  align-items: center;
  background: ${(props) => props.theme.bg};
  color: ${(props) => props.theme.tc};
`;

const Col = styled.div`
  display: flex;
  flex-direction: column;
  background: ${(props) => props.theme.bg};
  color: ${(props) => props.theme.tc};
`;

const Spacer = styled.div`
  width: 0;
  height: 0;
  background: transparent;
  margin: 5px;
`;

const InField = styled.input`
  background: ${(props) => props.theme.bg};
  color: ${(props) => props.theme.tc};
  border-radius: 3px;
  &::placeholder: {
    color: ${(props) => props.theme.ph};
    opacity: 1;
  }
`;

const StBtn = styled.button`
  width: min-content;
  height: min-content;
  margin: 0 1px 0;
  border-radius: 3px;
  align-self: flex-start;
  white-space: nowrap;
  background: ${(props) => props.theme.bg};
  color: ${(props) => props.theme.tc};
  outline: ${(props) => props.theme.ol};
`;

const rotateAnimation = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(359deg); }
`;

const LoadingImg = styled.img`
  height: 1em;
  width: 1em;
  animation: ${rotateAnimation} 2s infinite linear;
`;

Row.defaultProps =
  Col.defaultProps =
  Spacer.defaultProps =
  InField.defaultProps =
  StBtn.defaultProps =
    {
      theme: {
        bg: 'white',
        tc: 'black',
      },
    };

const Note = () => {
  return (
    <div>
      The personal access token is optional but your request may fail if your
      repository has more than 20 branches. <br />
      Providing your personal access token increases the API rate limit to 5000
      requests per hour, which should handle repos of all sizes. <br />
      See{' '}
      <a href='https://docs.github.com/en/rest/guides/getting-started-with-the-rest-api#authenticating'>
        this doc page
      </a>
      .<br />
      <br />
      This{' '}
      <a href='https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token'>
        doc
      </a>{' '}
      will help with getting a personal access token.
      <br />
      <br />
      You can set up a new personal access token{' '}
      <a href='https://github.com/settings/tokens/new'>here</a>. <br />
      There is no need to include any additional permissions for a new token
      used here when presented the option.
      <br />
      <br />
      <p className='warning'>
        We do NOT share or store your personal access token under any
        circumstances. <br />
        You can verify this by viewing the source code{' '}
        <a href='https://github.com/bnidevs/bnidevs.github.io/tree/main/get-my-commits'>
          here
        </a>
        .
      </p>
    </div>
  );
};

const TextIn = (props) => {
  return (
    <InField
      type='text'
      placeholder={props.ph}
      size='60'
      style={{ marginBottom: '5px' }}
      onChange={props.oc}
      name={props.nm}
      autoComplete='true'
    />
  );
};

const PassIn = (props) => {
  return (
    <InField
      type='password'
      placeholder={props.ph}
      size='40'
      ref={props.fref}
      disabled={props.dsst}
    />
  );
};

const Wrapper = styled.p`
  margin: 0;
`;

const StatusEmoji = (props) => {
  return <Wrapper>{String.fromCodePoint(props.good)}</Wrapper>;
};

const CheckboxRow = (props) => {
  return (
    <Row>
      <input
        type='checkbox'
        disabled={props.dsst}
        ref={props.fref}
        onChange={props.oc}
      ></input>
      {props.label}
    </Row>
  );
};

const CommitTable = styled.table`
  font-family: monospace;
  width: min-content;
  white-space: nowrap;
`;

const Main = () => {
  const tokenRef = useRef();
  const statsRef = useRef();
  const darkMRef = useRef();
  const [baseDate, setBaseDate] = useState(new Date());
  const [linkList] = useState({}); // slightly misleading, this is an object, not a list/array
  const [commitList] = useState([]);
  const [getStatus, setGetStatus] = useState(GetEnum.None);
  const [errMsg, setErrMsg] = useState('');
  const [author, setAuthor] = useState('');
  const [loading, setLoading] = useState(false);
  const [numRepos, setNumRepos] = useState(1);
  const [darkMode, setDarkMode] = useState(false);
  const [chooseDt, setChooseDt] = useState(false);
  const [okit, setOkit] = useState(new Octokit());
  const [tokenCheck, setTokenCheck] = useState(StatusEnum.None);

  const insertToken = async () => {
    setOkit(new Octokit({ auth: tokenRef.current.value }));
  };

  const changeDM = () => {
    const cbs = darkMRef.current.checked;
    setDarkMode(cbs);
    document.cookie = JSON.stringify({ dark: cbs });
  };

  const getAllCommits = async () => {
    const repoList = Object.values(linkList);
    let shaSet = {};
    setLoading(true);
    try {
      Promise.all(repoList.map(getPerRepo))
        .then((commits) => {
          commits.forEach((perRepo) => {
            perRepo
              .filter((c) => {
                return c.parents.length < 2;
              })
              .filter((c) => {
                let b = false;
                if (!(c.commit.tree.sha in shaSet)) {
                  shaSet[c.commit.tree.sha] = 1;
                  b = true;
                }
                return b;
              })
              .forEach((c) => {
                commitList.push(c);
              });
          });
        })
        .then(() => {
          setLoading(false);
          setGetStatus(GetEnum.Success);
        });
    } catch (e) {
      setGetStatus(GetEnum.Failed);
      setErrMsg(e.toString());
    }
  };

  const getPerRepo = async (l) => {
    const repoPath = new URL(l).pathname.replace(/^\/|\/$/g, '').split('/');
    let shaSet = {};
    let allCommits = [];
    const mainCommits = await okit.paginate(okit.rest.repos.listCommits, {
      owner: repoPath[0],
      repo: repoPath[1],
      author: author,
      since: baseDate.toISOString(),
    });

    mainCommits.forEach((c) => {
      shaSet[c.commit.tree.sha] = 1;
    });

    allCommits = allCommits.concat(mainCommits);

    let branches = await okit.paginate(okit.rest.repos.listBranches, {
      owner: repoPath[0],
      repo: repoPath[1],
    });

    branches = branches.map((b) => b.name);

    return Promise.all(
      branches.map(async (b) => {
        let branchCommits = await okit.paginate(okit.rest.repos.listCommits, {
          owner: repoPath[0],
          repo: repoPath[1],
          author: author,
          since: baseDate.toISOString(),
          sha: b,
        });

        branchCommits = branchCommits.filter((c) => {
          let b = false;
          if (!(c.commit.tree.sha in shaSet)) {
            shaSet[c.commit.tree.sha] = 1;
            b = true;
          }
          return b;
        });

        return branchCommits;
      })
    )
      .then((bCommits) => {
        bCommits.forEach((branch) => {
          allCommits = allCommits.concat(branch);
        });
      })
      .then(() => {
        allCommits.sort((a, b) => {
          return -(
            new Date(a.commit.author.date) - new Date(b.commit.author.date)
          );
        });

        return allCommits;
      });
  };

  useEffect(() => {
    const checkToken = async () => {
      try {
        await okit.rest.users.getAuthenticated();
        setTokenCheck(StatusEnum.Success);
      } catch {
        setTokenCheck(StatusEnum.Failed);
      }
    };

    if (tokenRef.current.value !== '') {
      checkToken();
    }
  }, [okit]);

  useEffect(() => {
    if (document.cookie === '') {
      document.cookie = JSON.stringify({ dark: false });
    } else {
      const cookieDM = JSON.parse(document.cookie).dark;
      setDarkMode(cookieDM);
      darkMRef.current.checked = cookieDM;
    }
  }, []);

  useEffect(() => {
    setBaseDate(GetBaseDate());
  }, []);

  const dmTheme = {
    bg: 'black',
    tc: 'white',
    ph: '#ccc',
    ol: '1px white solid',
  };

  return (
    <ThemeProvider theme={darkMode ? dmTheme : {}}>
      <Col className='main'>
        <Row>
          <Col>
            {Array.from({ length: numRepos }, (v, i) => (
              <TextIn
                ph='GitHub Repo Link'
                key={i}
                oc={(e) => {
                  linkList[i] = e.target.value;
                }}
                nm='repolink'
              />
            ))}
          </Col>
          <Spacer />
          <StBtn onClick={() => setNumRepos(numRepos + 1)}>+</StBtn>
        </Row>
        <Spacer />
        <Row>
          <TextIn
            ph='Email or Username'
            oc={(e) => {
              setAuthor(e.target.value);
            }}
            nm='githubid'
          />
        </Row>
        <Spacer />
        <Row>
          <PassIn
            ph='Personal Access Token'
            fref={tokenRef}
            dsst={tokenCheck === StatusEnum.Success}
          />
          <Spacer />
          <StBtn onClick={insertToken}>Check Token</StBtn>
          <Spacer />
          <StatusEmoji good={tokenCheck} />
        </Row>
        <Spacer />
        <CheckboxRow
          label='additions + subtractions (requires token)'
          fref={statsRef}
          dsst={tokenCheck !== StatusEnum.Success}
        />
        <CheckboxRow
          label='choose date'
          oc={(e) => setChooseDt(e.target.checked)}
        />
        <CheckboxRow
          label='dark mode (for the nocturnals)'
          oc={changeDM}
          fref={darkMRef}
        />
        <Spacer />
        {chooseDt && (
          <>
            <Row>
              <input
                type='date'
                defaultValue={ISODate(baseDate)}
                min={ISODate(new Date(new Date().getFullYear(), 0, 1))}
                max={ISODate(new Date())}
                onChange={(e) => {
                  setBaseDate(new Date(e.target.value));
                }}
              />
            </Row>
            <Spacer />
          </>
        )}
        <Note />
        <Row>
          <StBtn onClick={getAllCommits}>Submit</StBtn>
          <Spacer />
          {loading && (
            <LoadingImg src='https://github.com/rcos/rcos-branding/blob/master/img/logo-circle-red.png?raw=true' />
          )}
        </Row>
        <Spacer />
        <Spacer />
        <Spacer />
        {getStatus === GetEnum.Success && (
          <Col>
            <Row>
              <StBtn>Copy</StBtn>
              <StBtn>Download</StBtn>
            </Row>
            <Spacer />
            <CommitTable>
              <tbody>
                {commitList.map((e) => (
                  <tr key={e.sha}>
                    <td>
                      <a href={e.html_url}>{e.html_url}</a>
                    </td>
                    <td>
                      {new Date(e.commit.author.date)
                        .toDateString()
                        .substring(3)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </CommitTable>
          </Col>
        )}
        {getStatus === GetEnum.Failed && (
          <Col>
            <p className='warning'>Fetch failed</p>
            <p>{errMsg}</p>
          </Col>
        )}
      </Col>
    </ThemeProvider>
  );
};

export default Main;
