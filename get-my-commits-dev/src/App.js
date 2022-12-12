import './App.css';
import { Octokit, App } from 'octokit';
import { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';

const StatusEnum = {
  None: '',
  Failed: '0x274C',
  Success: '0x2705',
};

const Row = styled.div`
  display: flex;
`;

const Col = styled.div`
  display: flex;
  flex-direction: column;
  background: ${(props) => (props.dm ? 'black' : 'white')};
  color: ${(props) => (props.dm ? 'white' : 'black')};
`;

const Spacer = styled.div`
  width: 10px;
  height 10px;
`;

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
  return <input type='text' placeholder={props.ph} size='60' />;
};

const PassIn = (props) => {
  return (
    <input
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

const StBtn = styled.button`
  width: min-content;
  height: min-content;
`;

const Main = () => {
  const tokenRef = useRef();
  const statsRef = useRef();
  const darkMRef = useRef();
  const [numRepos, setNumRepos] = useState(1);
  const [darkMode, setDarkMode] = useState(false);
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

  const getCommits = async () => {};

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

  return (
    <Col className='main'>
      <Row>
        <Col>
          {Array.from({ length: numRepos }, (v, i) => (
            <Col key={i}>
              <TextIn ph='GitHub Repo Link' />
              <Spacer />
            </Col>
          ))}
        </Col>
        <Spacer />
        <StBtn onClick={(e) => setNumRepos(numRepos + 1)}>+</StBtn>
      </Row>
      <Spacer />
      <Row>
        <TextIn ph='Email or Username' />
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
      <CheckboxRow label='choose date' />
      <CheckboxRow
        label='dark mode (for the nocturnals)'
        oc={changeDM}
        fref={darkMRef}
      />
      <Spacer />
      <Note />
      <StBtn onClick={getCommits}>Submit</StBtn>
    </Col>
  );
};

export default Main;
