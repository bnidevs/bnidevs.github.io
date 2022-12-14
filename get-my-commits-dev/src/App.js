import './App.css';
import { Octokit, App } from 'octokit';
import { useState, useRef, useEffect } from 'react';
import styled, { ThemeProvider } from 'styled-components';

const StatusEnum = {
  None: '',
  Failed: '0x274C',
  Success: '0x2705',
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
  const [linkList] = useState({}); // slightly misleading, this is an object, not a list/array
  const [commitList, setCommitList] = useState([]);
  const [author, setAuthor] = useState('');
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
    Promise.all(repoList.map(getPerRepo)).then((commits) => {
      setCommitList(commitList.concat(...commits));
    });
  };

  const getPerRepo = async (l) => {
    const repoPath = new URL(l).pathname.replace(/^\/|\/$/g, '').split('/');
    const commits = okit.paginate(okit.rest.repos.listCommits, {
      owner: repoPath[0],
      repo: repoPath[1],
      author: author,
    });
    return commits;
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
        <Row>{chooseDt && <input type='date' />}</Row>
        <Spacer />
        <Note />
        <StBtn onClick={getAllCommits}>Submit</StBtn>
        <Spacer />
        <Spacer />
        <Spacer />
        {commitList.length > 0 && (
          <Col>
            <Row>
              <StBtn>Copy</StBtn>
              <StBtn>Download</StBtn>
            </Row>
            <Spacer />
            <CommitTable>
              {commitList.map((e) => (
                <tr key={e.sha}>
                  <td>
                    <a href={e.html_url}>{e.html_url}</a>
                  </td>
                  <td>
                    {new Date(e.commit.author.date).toDateString().substring(3)}
                  </td>
                </tr>
              ))}
            </CommitTable>
          </Col>
        )}
      </Col>
    </ThemeProvider>
  );
};

export default Main;
